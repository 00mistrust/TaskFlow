document.addEventListener('DOMContentLoaded', () => {
  const storedName = localStorage.getItem('userName');
  const userNameSpan = document.getElementById('userName');

  console.log("JIBNA NAME MN LOCALSTORAGE", storedName);
  console.log("HTML Span element found:", userNameSpan);

  if (storedName && userNameSpan) {
    userNameSpan.textContent = storedName;
    console.log("navbar tbdlat ", storedName);
  } else {
    console.log("failed to change name f navbar");
  }
});