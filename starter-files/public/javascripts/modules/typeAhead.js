import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
  return stores
    .map(store => {
      return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `;
    })
    .join('');
}

function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResutls = search.querySelector('.search__results');

  searchInput.on('input', e => {
    const value = e.target.value;
    if (!value) {
      searchResutls.style.display = 'none';
      return;
    }
    searchResutls.style.display = 'block';

    axios
      .get(`api/search?q=${value}`)
      .then(res => {
        if (res.data.length) {
          const html = searchResultsHTML(res.data);
          searchResutls.innerHTML = dompurify(html);
          return;
        }
        searchResutls.innerHTML = dompurify(`<div class="search__result">Not result found for ${value} found!</div>`)
      })
      .catch(err => {
        console.log(err);
      });
  });

  //handle keyboard navigation
  searchInput.on('keyup', e => {
    //if not enter, keyup or keydown, we skip !
    if (![38, 40, 13].includes(e.keyCode)) {
      return;
    }
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
