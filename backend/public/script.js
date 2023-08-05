let currentPage = 1;
let itemPerPage = 5;
let pagination = document.getElementById('pagination');
let list = document.getElementById('list')
function displayList(items, wrapper, itemsPerPage, page) {
  wrapper.innerHTML = "";
  page--;
  let start = itemsPerPage * page;
  let end = start + itemsPerPage;
  let pagination = items.slice(start, end)
  console.log(pagination)
  for (let i = 0; i < pagination.length; i++) {
    let item = pagination[i];
    let elem = document.createElement('div');
    elem.classList.add('item')
    elem.innerText = item
    wrapper.appendChild(elem)
  }
}
function setPage(items, wrapper, itemsPerPage) {
  wrapper.innerHtml = "";
  let pagecount = Math.ceil(data.length / itemPerPage);
  for (let i = 1; i < pagecount + 1; i++) {
    let btn = displayButton(i, items)
    wrapper.appendChild(btn)
  }

}
function displayButton(page, items) {


  let button = document.createElement('button');
  button.classList.add('btn')

  button.innerText = page;
  button.innerText = page;
  if (currentPage == page) {
    button.classList.add('btn-primary')
  }
  button.addEventListener('click', function () {
    console.log("clicked", page)
    console.log(items)
    currentPage = page;
    displayList(items, list, itemPerPage, currentPage)
    let currentButton = document.querySelector('.btn-primary')
    currentButton.classList.remove('btn-primary')
    button.classList.add('btn-primary')
  })
  return button
}

displayList(data, list, itemPerPage, currentPage)
setPage(data, pagination, itemPerPage)//
const updateData = document.getElementById("updateData").addEventListener("click", function () {
    let url = "http://localhost:8000/shop/product"
    let form = document.getElementById('updateForm');
    let formData = new FormData(form)
    const requestConfig = {
      method: "POST",

      body: formData // Convert the data to JSON string and set it as the request body
    };

    fetch(url, requestConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        return response.json(); // If the response is successful, parse the JSON data
      })
      .then(data => {
        console.log("POST request response:", data); // Handle the response data
      })
      .catch(error => {
        console.error("Error:", error); // Handle errors
      });
    myModal.hide()
  });