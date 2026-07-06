const contactEmail = "direct@fanatic.space";

const emailLink = document.querySelector("#emailLink");
const leadForm = document.querySelector("#leadForm");

emailLink.href = `mailto:${contactEmail}`;
emailLink.textContent = contactEmail;

leadForm.addEventListener("submit", (event) => {
  const data = new FormData(leadForm);
  const email = data.get("email");
  const replyTo = leadForm.querySelector('input[name="_replyto"]');

  if (replyTo) {
    replyTo.value = email;
  }
});
