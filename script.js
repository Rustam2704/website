const contactEmail = "direct@fanatic.space";

const emailLink = document.querySelector("#emailLink");
const leadForm = document.querySelector("#leadForm");

emailLink.href = `mailto:${contactEmail}`;
emailLink.textContent = contactEmail;

leadForm.addEventListener("submit", (event) => {
  const mailtoFallbackHosts = ["", "localhost", "127.0.0.1"];
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const isStaticCustomDomain = window.location.hostname === "fanatic.space";
  const shouldUseMailtoFallback =
    mailtoFallbackHosts.includes(window.location.hostname) || isGitHubPages || isStaticCustomDomain;

  if (!shouldUseMailtoFallback) {
    return;
  }

  event.preventDefault();

  const data = new FormData(leadForm);
  const name = data.get("name");
  const email = data.get("email");
  const area = data.get("area");
  const goal = data.get("goal");

  const mailSubject = encodeURIComponent(`Free consultation request: ${area}`);
  const mailBody = encodeURIComponent(
    [
      "Hi,",
      "",
      "I would like to request a free 15-minute consultation.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Area: ${area}`,
      "",
      "Problem / goal:",
      goal,
      "",
      "Preferred contact method and time zone:",
      "",
      "Thank you."
    ].join("\n")
  );

  window.location.href = `mailto:${contactEmail}?subject=${mailSubject}&body=${mailBody}`;
});
