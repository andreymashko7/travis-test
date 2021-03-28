const Mailgen = require("mailgen");
const sgMail = require("@sendgrid/mail");
const config = require("../config/email.json");

require("dotenv").config();

class EmailService {
  #sender = sgMail;
  #GenerateTemplate = Mailgen;
  constructor(env) {
    switch (env) {
      case "development":
        this.link = config.dev;
        break;
      case "stage":
        this.link = config.stage;
        break;
      case "production":
        this.link = config.prod;
        break;
      default:
        this.link = config.dev;
        break;
    }
  }

  #createTemplate(verifyToken, name = "Guest") {
    const mailGenerator = new this.#GenerateTemplate({
      theme: "salted",
      product: {
        name: "System contacts",
        link: this.link,
      },
    });
    const template = {
      body: {
        name,
        intro: "This is  a test",
        action: {
          instructions: "чтобы закончить регистрацию кликните по кнопке",
          button: {
            color: "#48cfad",
            text: "Confirm your account",
            link: `${this.link}/api/users/auth/verify/${verifyToken}`,
            // link: `${this.link}/api/users/verify/${verifyToken}`,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
    return mailGenerator.generate(template);
  }

  async sendEmail(verifyToken, email, name) {
    const emailBody = this.#createTemplate(verifyToken, name);
    this.#sender.setApiKey(process.env.SENGRID_API_KEY);
    const msg = {
      to: email,
      from: "andreymashko7@gmail.com",
      subject: "Подтверждение регистрации",
      html: emailBody,
    };
    await this.#sender.send(msg);
  }
}

module.exports = EmailService;
