async function test() {
  const apiKey = "AIzaSyBzqbIVUdXGBo54_OM4wmT9W3Vi2t7305M";
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
