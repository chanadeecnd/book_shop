const form = document.querySelector('#form')
const username = document.querySelector('#username')
const email = document.querySelector('#email')
const password = document.querySelector('#password')
const confirmPassword = document.querySelector('#confirm-password')

//show Error messages
function showError(input,messages){
    const formControl = input.parentElement
    formControl.classList.remove('success')
    formControl.classList.add('error');
    const small = formControl.querySelector('small')
    small.innerText = messages;
}

//show Success messages
function showSuccess(input){
    const formControl = input.parentElement;
    formControl.classList.remove('error')
    formControl.classList.add('success')
}

//check email is valid
function checkEmail(input){
    const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if(re.test(input.value.trim())){
        showSuccess(input)
    }else{
        showError(input,'Email is not Valid')
    }
}

//check required fields
function chekRequired(inputArr){
    inputArr.forEach((input)=>{
        if(input.value.trim() === ''){
            showError(input,`${getFieldName(input)}`)
        }else{
            showSuccess(input)
        }
    })
}

//check length
function checkLength(input,min,max){
    if(input.value.length < min){
        showError(input,`${getFieldName(input)} must be least ${min} characters`)
    }else if(input.value.length > max){
        showError(input,`${getFieldName(input)} must be less than ${max} characters`)
    }
    else{
        showSuccess(input)
    }
}

//getFielName
function getFieldName(input){
    return input.id.charAt(0).toUpperCase() + input.id.slice(1)
}

//check password mach
function checkPasswordMatch(input1,input2){
    if(input1.value !== input2.value){
        showError(input2,"Password do not match")
    }
}

function showNotification() {
    toastr.success('This is a success notification!');
}

let elems = document.getElementsByClassName('confirmation');
function confirmSubmit(){
    
    let confirmIt = function (e) {
        if (!confirm('Are you sure?')) e.preventDefault();
    };
    for (var i = 0, l = elems.length; i < l; i++) {
        elems[i].addEventListener('click', confirmIt, false);
    }
}


function productToExcel(type, fn, dl) {
    var elt = document.getElementById('productTable');
    var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('products.' + (type || 'xlsx')));
 }

function userToExcel(type, fn, dl) {
    var elt = document.getElementById('userTable');
    var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('users.' + (type || 'xlsx')));
 }
new DataTable('#productTable');
new DataTable('#userTable');

