const express = require("express");
const { PORT, NODE_ENV, FRONTEND_URL } = require("./config/envConfig");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require("./utils/logger");
const morganMiddleware = require("./middleware/loggerMiddleware");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

// Routes
const webhookRoutes = require("./routes/webhook.routes");
const authRoutes = require("./routes/auth.routes");
const mediaRoutes = require("./routes/media.routes");
const fbTokenRoutes = require("./routes/fbToken.routes");
const commentRoutes = require("./routes/comment.routes");
const privateReplyRoutes = require("./routes/privateReply.routes");
const automatedPostRoutes = require("./routes/automatedPost.routes");
const dmLogRoutes = require("./routes/dmLog.routes");

const { sendInstagramDM } = require("./sendDM");
const sendReply = require("./sendReply");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morganMiddleware);

// Routes
app.use("/webhook", webhookRoutes);
app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/fb-token", fbTokenRoutes);
app.use("/comment", commentRoutes);
app.use("/private-reply", privateReplyRoutes);
app.use("/automated-post", automatedPostRoutes);
app.use("/dm-log", dmLogRoutes);

app.get("/", (req, res) => {
  logger.info("GET / - root route hit");
  res.send("INSTAGRAM AUTOMATION BACKEND SERVER IS RUNNING");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy", {
    email: "tn34sasikumar@gmail.com",
    appName: "All Tech Tamil",
  });
});

// Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  connectDB();
  // sendReply(
  //   "18139398340411605",
  //   "Test",
  //   "EAAJZBumxZBLCcBPF42w3lZC5bq4sgnG0ItQaVKl0SZCZCfKPeYEV08ouAwuucjWiMtwYYVvpUTUvJUhbFYs3ICeKYLboMF6iCaj8pfxc9KKeCx4wsJ2UBObBZBD1AVZCMwinquGRW8T2YqgxMz7ySEU844vv9hGIEeAruYcOnvJxX4uZCg91Op9nMtb0Pz5Qztl6kZCKjAPyeq3AuE9L03r5ZCP41X"
  // );
  logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`🔗 http://localhost:${PORT}`);
});
