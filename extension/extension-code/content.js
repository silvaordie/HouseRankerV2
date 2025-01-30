// content.js (remains the same)
function scrapeDivs() {
    const divs = document.querySelectorAll('div.HgListingCard_info_RKrwz');
    const divContents = [];
  
    divs.forEach(div => {
      divContents.push(div.innerHTML); // Or div.textContent for plain text
    });
  
    return divContents;
  }
  