const contactEmail = "direct@fanatic.space";

const emailLink = document.querySelector("#emailLink");
const leadForm = document.querySelector("#leadForm");

emailLink.href = `mailto:${contactEmail}`;
emailLink.textContent = contactEmail;

leadForm.addEventListener("submit", (event) => {
  const data = new FormData(leadForm);
  const name = data.get("name");
  const email = data.get("email");
  const area = data.get("area");
  const replyTo = leadForm.querySelector('input[name="_replyto"]');
  const subject = leadForm.querySelector('input[name="_subject"]');

  if (replyTo) {
    replyTo.value = email;
  }

  if (subject) {
    const cleanName = String(name || "Unknown").trim().slice(0, 60);
    const cleanArea = String(area || "No area").trim().slice(0, 80);
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

    subject.value = `Consultation: ${cleanName} / ${cleanArea} / ${stamp}`;
  }
});
