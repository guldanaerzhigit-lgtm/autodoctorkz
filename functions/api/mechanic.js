export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: "ИИ пока не подключён: добавьте OPENAI_API_KEY в Cloudflare Pages → Settings → Variables and Secrets." }, { status: 503 });
  }
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.length > 20) {
    return Response.json({ error: "Передайте от 1 до 20 сообщений." }, { status: 400 });
  }
  const safeMessages = messages
    .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2500) }));
  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return Response.json({ error: "Последнее сообщение должно быть от пользователя." }, { status: 400 });
  }
  const v = body.vehicle && typeof body.vehicle === "object" ? body.vehicle : {};
  const vehicleInfo = [v.brand, v.model, v.year, v.engine, v.transmission].filter(Boolean).join(" ");
  const system = `Ты AutoDoctor PRO KZ — осторожный автомобильный помощник для пользователей Казахстана. Отвечай по-русски, понятно и по пунктам. Автомобиль пользователя: ${vehicleInfo || "не указан"}.
Правила: различай гипотезы и подтверждённые факты; задавай уточняющие вопросы, если не хватает года, двигателя, коробки, симптомов или кодов OBD2. Не выдумывай номера предохранителей, ампераж, OEM-артикулы, моменты затяжки или совместимость деталей. Для точных значений попроси свериться с заводской схемой/каталогом по VIN и комплектации. Предлагай безопасные первичные проверки и объясняй, когда нужен механик. При проблемах тормозов, рулевого управления, утечке топлива, дыме, перегреве или сильной потере тяги советуй безопасно остановиться и не продолжать движение. Не проси отключать системы безопасности. Формат: вероятные причины, что проверить по шагам, что уточнить, уровень срочности.`;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "system", content: system }, ...safeMessages],
        temperature: 0.3,
        max_tokens: 700
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return Response.json({ error: "ИИ-сервис не ответил. Проверьте API-ключ, доступ к модели и лимиты." }, { status: 502 });
    }
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return Response.json({ error: "ИИ вернул пустой ответ." }, { status: 502 });
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Не удалось связаться с ИИ-сервисом." }, { status: 502 });
  }
}
