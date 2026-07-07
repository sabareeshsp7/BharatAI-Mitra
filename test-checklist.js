

async function testAPI() {
  try {
    const res = await fetch("http://localhost:3000/api/ai/document-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: "awas", language: "en" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

testAPI();
