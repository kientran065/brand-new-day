//nut menu toggle
const toggle=document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav");

toggle.onclick = () => {
    menu.classList.toggle("show");
}
//form 
const form = document.getElementById("myForm");
form.addEventListener("submit", function(e) {
    e.preventDefault(); //ngan web tu reload
    let isValid = true;
    
    const name = document.getElementById("Name");
    const phone = document.getElementById("Phone");
    const mail = document.getElementById("Mail")
    
    // Reset lỗi cũ
    document.querySelectorAll(".error").forEach(el => el.innerText = "");
    document.querySelectorAll("input").forEach(el => el.classList.remove("error-input"));
    
    // Validate Name
    if (name.value.trim() === "") {
        showError(name, "Write your name");
        isValid = false;
    }
    // Validate Phone
    if (phone.value.trim() === "") {
    showError(phone, "Write your phone number");
    isValid = false;
    } else if (phone.value.length != 10){
    showError(phone, "Phone must have 10 numbers");
    isValid = false;
    }
    //Validate Email
    if (mail.value.trim()=== "") {
        showError(mail, "Write your email");
        isValid = false;
    } else if (!mail.value.includes("@")){
        showError(mail,"Wrong format email");
        isValid = false;
    } else if (!mail.value.includes(".")){
        showError(mail,"Wrong format email");
        isValid = false;
    }
    
    if (isValid) {
        document.getElementById("successMsg").innerText = "Completed successfully!";
        form.reset();
    }
});

function showError(input, message) {
    input.classList.add("error-input");
    input.nextElementSibling.innerText = message;
}