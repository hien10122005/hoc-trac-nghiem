async function test() {
  const apiKey = "AIzaSyAKA0xtxYQbOHAyOxbi8G317neBJr19FiW";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("TEST FiW:", data.error ? data.error.message : "SUCCESS");
  } catch (e) {
    console.log(e);
  }
}
test();
