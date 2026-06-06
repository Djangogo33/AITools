  // ---- QUICK TAB ----
  document.getElementById('whatsappBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://whatsapp.com/channel/0029Vb8UrEOAojYufmkWsd35' });
  });