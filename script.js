const contactEmail = "direct@fanatic.space";
const config = window.FANATIC_CRM_SUPABASE || {};
let supabase = null;

const emailLink = document.querySelector("#emailLink");
const leadForm = document.querySelector("#leadForm");

emailLink.href = `mailto:${contactEmail}`;
emailLink.textContent = contactEmail;

if (config.url && config.anonKey) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabase = createClient(config.url, config.anonKey);
}

leadForm.addEventListener("submit", async (event) => {
  if (leadForm.dataset.nativeSubmit === "true") return;

  event.preventDefault();
  const data = new FormData(leadForm);
  const name = data.get("name");
  const email = data.get("email");
  const area = data.get("area");
  const goal = data.get("goal");
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

  if (supabase) {
    try {
      const { error } = await supabase.from("intake_requests").insert({
        name,
        email,
        area,
        goal,
        source: "fanatic.space"
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Supabase intake save failed, falling back to email-only submit.", error);
    }
  }

  leadForm.dataset.nativeSubmit = "true";
  leadForm.submit();
});
