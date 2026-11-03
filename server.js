
const express = require("express");

const app = express();

// Разрешаем запросы с GitHub Pages
const allowedOrigins = [
  "https://smkk02.github.io"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );
  }

  // Обработка CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

// Проверка работы сервера
app.get("/", (req, res) => {
  res.send("SMKK02 SERVER ONLINE");
});

// Страница проверки заявки
app.get("/test", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Тест заявки SMKK02</title>
      <style>
        body {
          margin: 0;
          padding: 25px;
          background: #08060d;
          color: white;
          font-family: Arial, sans-serif;
        }

        main {
          max-width: 420px;
          margin: 40px auto;
        }

        input, textarea, button {
          box-sizing: border-box;
          width: 100%;
          margin-top: 12px;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #7838a8;
          background: #171020;
          color: white;
          font-size: 16px;
        }

        textarea {
          min-height: 120px;
        }

        button {
          background: #8b32d1;
          border: 0;
          font-weight: bold;
        }

        #result {
          margin-top: 20px;
        }
      </style>
    </head>

    <body>
      <main>
        <h1>SMKK02</h1>
        <p>Тестовая отправка заявки</p>

        <form id="orderForm">
          <input name="name" placeholder="Твоё имя" required>
          <input name="contact" placeholder="Твой Telegram" required>
          <textarea name="message" placeholder="Текст заявки" required></textarea>
          <button type="submit">Отправить заявку</button>
        </form>

        <p id="result"></p>
      </main>

      <script>
        const form = document.getElementById("orderForm");
        const result = document.getElementById("result");

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          result.textContent = "Отправляем...";

          const data = Object.fromEntries(new FormData(form));

          try {
            const response = await fetch("/order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(data)
            });

            const answer = await response.json();

            if (answer.success) {
              result.textContent = "Заявка успешно отправлена!";
              form.reset();
            } else {
              result.textContent = "Ошибка: " + answer.error;
            }
          } catch (error) {
            result.textContent = "Не удалось связаться с сервером";
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Приём заявок
app.post("/order", async (req, res) => {
  try {
    const { name, contact, message } = req.body || {};

    if (!name || !contact || !message) {
      return res.status(400).json({
        success: false,
        error: "Заполните все поля"
      });
    }

    if (!BOT_TOKEN || !ADMIN_ID) {
      return res.status(500).json({
        success: false,
        error: "Server settings missing"
      });
    }

    const text =
      "НОВАЯ ЗАЯВКА SMKK02\n\n" +
      "Имя: " + String(name).slice(0, 100) + "\n" +
      "Контакт: " + String(contact).slice(0, 150) + "\n\n" +
      "Задача:\n" + String(message).slice(0, 3000);

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error("Telegram delivery error");
    }

    res.json({ success: true });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Не удалось отправить заявку"
    });
  }
});

app.listen(PORT, () => {
  console.log("SMKK02 server started on port " + PORT);
});
