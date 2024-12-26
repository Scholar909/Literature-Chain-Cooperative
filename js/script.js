window.addEventListener("DOMContentLoaded", () => {
    const headerHeight = document.querySelector("header").offsetHeight;
    document.documentElement.style.setProperty("scroll-padding-top", `${headerHeight}px`
    );
});

function updateAvailableBooksCount(){
    const bookList = document.querySelectorAll('#book-list .service');
    const availableBookCount = document.getElementById('available-count');

    availableBookCount.textContent = bookList.length;
}
updateAvailableBooksCount();


document.addEventListener("DOMContentLoaded", () => {
    const cartItems = document.getElementById("cart-items");
    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    const cartCount = document.getElementById("cart-count");

    const cart = new Set(JSON.parse(localStorage.getItem("cart")) || []);

    const updateCartCount = () => {
        cartCount.textContent = cart.size;

        localStorage.setItem("cart", JSON.stringify([...cart]));
    };

    const populateCart = () => {
        cartItems.innerHTML = "";

        if (cart.size === 0){
            cartItems.innerHTML = "<li>Your cart is empty.</li>";
        } else {
            cart.forEach((productName) => {
                const cartItem = document.createElement("li");

                cartItem.textContent = productName;

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "X";

                deleteButton.addEventListener("click", () => {
                    cart.delete(productName);

                    cartItem.remove();
                    updateCartCount();
                    if (cart.size === 0){
                        cartItems.innerHTML = "<li>Your cart is empty.</li>";
                    }
                });

                cartItem.appendChild(deleteButton);
                cartItems.appendChild(cartItem);
            });
        }
    };

    populateCart();
    updateCartCount();

    addToCartButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const product = button.parentElement;
            const productName = product.querySelector("h3").textContent;

            if (cart.has(productName)){
                alert(`${productName} has already been added to the cart.`);
                return;
            }

            cart.add(productName);
            updateCartCount();

            if (cartItems.querySelector("li").textContent === "Your cart is empty."){
                cartItems.innerHTML = "";
            }
            const cartItem = document.createElement("li");
            cartItem.textContent = productName;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.addEventListener("click", () => {
                cart.delete(productName);
                cartItem.remove();
                updateCartCount();
                if (cartItems.children.length === 0){
                    cartItems.innerHTML = "<li>Your cart is empty.<li>";
                }
            });

            cartItem.appendChild(deleteButton);
            cartItems.appendChild(cartItem);
        });
    });
});



document.querySelector('#request-form').addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const bookRequest = document.querySelector('#book-request').value;

    const message = `Name: ${name}\nEmail: ${email}\nBook Request: ${bookRequest}`;

    const whatsappUrl = `https://wa.me/2349168873680?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
});


const rawNumber = document.querySelector("#whatsapp-number").value;
const formattedNumber = formatWhatsappNumber(rawNumber);
console.log(formattedNumber);

let availableKeywords = [
    'SOUP-A-STAR COOKBOOK',
    'A-TIME-TO-EAT COOKBOOK',
    'MINI-AFFILIATE-MARKETING',
    'AFFILIATE-MARKETING-FOR-BEGINNERS',
    'MONEY-MINDSET',
    'BEGINNERS-AFFILIATE-MARKETING-GUIDE',
    'PAYAH-BUSINESS-SCHOOL',
    'GUIDE-TO-6-FIGURES-ONLINE',
    'PROFIT-ACCELERATOR-BLUEPRINT',
    'SOCIAL-MEDIA-MARKETING',
    'EMAIL-MARKETING',
    'MONETIZATION',
    'AFFILIATE-MARKETING-SECRETS',
    'AFFILIATE-MARKETING-ACCELERATOR-PROGRAM',
    'DIGITAL-COURSES',
    'EBOOKS-AND-OTHER-PRODUCTS',
    '1000+ PROMPTS TO ELEVATE YOUR CONTENT, BUSINESS AND SOCIAL MEDIA TRATEGY',
    'HACKS, CODING, EBOOKS, JAMB PAST QUESTIONS AND ANSWERS 2010-2023',
    'SANTORINI-TRAVEL-GUIDE: 2024',
    '50 AI TOOLS HANDBOOK',
    'AI COMIC COURSE',
    'DAILY-GRACE-DEVOTIONAL',
    'HOW-TO-STOP-FEAR-SPIRITUALLY',
    'SONS-OF-THE-PROPHET',
    'HOW-TO-WORRY LESS-AND-PRAY-MORE',
    'RELATIONSHIP-DISCUSSIONS',
    'ASH by JASON BRANT',
    'ON PAGE SEO TACTICS FOR WORDPRESS: INCREASE GOOGLE RANKINGS',
    'EASY MEAL PLANNING GUIDE',
    'HOW-TO-LAUNCH-YOUR-BUSINESS-AS-A-CHRISTIAN',
    'WIG-MAKING-SIMPLIFIED',
    'LEARN SPANISH: SPANISH CACTUS',
    'COMPLETE-GERMAN-COURSE',
    'CRYPTO-PROFIT-KIT',
    'PUBLISH AND SELL BOOKS ON AMAZON',
];

const resultsBox = document.querySelector(".result-box");
const inputBox = document.getElementById("search");

inputBox.onkeyup = function(){
    let result = [];
    let input = inputBox.value;
    if (input.length){
        result = availableKeywords.filter((keyword)=>{
            return keyword.toLowerCase().includes(input.toLowerCase());
        });
        console.log(result);
    }
    display(result);

    if(!result.length){
        resultsBox.innerHTML = '';
    }
}

function display(result){
    const content = result.map((list=>{
        return "<li onclick=selectInput(this)>" + list + "</li>";
    }));

    resultsBox.innerHTML = "<ul>" + content.join('') + "</ul>";
}

function selectInput(list){
    inputBox.value = list.innerHTML;
    resultsBox.innerHTML = '';
}


const bookItems = document.querySelectorAll('.service');

search.addEventListener('input', () => {
    const searchText = search.value.toLowerCase();

    bookItems.forEach(service => {
        const title = service.getAttribute('data-title').toLowerCase();

        if(title.includes(searchText)){
            service.style.display = 'block';
        } else{
            service.style.display = 'none';
        }
    });
});

document.getElementById("searchButton").addEventListener('click', function(){
    const input = document.getElementById('search').value.trim().toLowerCase();
    const service = document.querySelectorAll(".service");

    let foundMatch = false;
    service.forEach(service => {
        const title = service.getAttribute("data-title").trim().toLowerCase();
        if (title === input) {
            service.style.display = "block";
            foundMatch = "true";
        } else{
            service.style.display = "none";
        }
    })

    if (!foundMatch){
        alert("No book found with that exact title. \nIf the book you seek is still not found, \nyou can make a Request and you'll be attended to immediately.");
    }
});

const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear-btn');

searchInput.addEventListener('input', function() {
    clearBtn.style.display = this.value? 'block' : 'none';
});

clearBtn.addEventListener('click', function(){
    searchInput.value = '';
    clearBtn.style.display = 'none'

    searchInput.focus();
});



document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector("nav ul");

    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });

    function applyResponsiveStyles(){
        const viewportWidth = window.innerWidth;

        if (viewportWidth <= 480){
            document.body.classList.add("phone");
            document.body.classList.remove("tablet");
        } else if (viewportWidth <= 768){
            document.body.classList.add("tablet");
            document.body.classList.remove("phone");
        } else {
            document.body.classList.remove("phone", "tablet");
        }
    }

    applyResponsiveStyles();

    window.addEventListener("resize", applyResponsiveStyles);
});

if (window.innerWidth < 800){
    document.body.style.overflowX = "clip";
}

window.addEventListener("resize", () =>{
    if (window.innerWidth < 800){
        document.body.style.overflowX = "clip";
    } else {
        document.body.style.overflowX = "auto";
    }
});

