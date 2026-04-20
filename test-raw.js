async function test() {
  const apiKey = "AIzaSyAKA0xtxYQbOHAyOxbi8G317neBJr19Fiw";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e);
  }
}
test();
