
  function addtoCart(proId){
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
          let count=$('#cartcount').html()
          count=parseInt(count)+1
          $('#cartcount').html(count)

        }
        
      }
    })
  };
  function addToWishlist(proId){
    $.ajax({
      url:'/add-to-wishlist/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status){
          let count=$('#wishlistcount').html()
          count=parseInt(count)+1
          $('#wishlistcount').html(count)

        }
        
      }
    })
  };
  function changeQuantity(cartId,proId,userId,count,price){
  let quantity=parseInt(document.getElementById(proId).innerHTML)
  count=parseInt(count)
  $.ajax({
    url:'/changeProductQuantity',
    data:{
      user:userId,
      cart:cartId,
      product:proId,
      count:count,
      quantity:quantity,
      price:price
    },
    method:'post',
    success:(response)=>{
      if(response.removeProduct){
        alert("Product removed from the cart")
        location.reload()
     

      }else{
       
        document.getElementById(proId).innerHTML=quantity+count
        document.getElementById('total').innerHTML=response.total
     
        // $(proId).html(count+quantity)
        
      }
      
    }
  })
  };
  
function removeItem(cartId,proId){
  $.ajax({
    url:'/removeItem',
    data:{
      cart:cartId,
      product:proId
    },
    method:'post',
    success:(response)=>{
        // alert("Product removed from the cart")
        location.reload()        
      }
      
    })
  }
  
  function couponApply() {
     alert('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh')
    let couponCode = document.getElementById('couponInput').value
    let couponTotal = document.getElementById('couponTotal').value
    document.getElementById('couponName').value = couponCode
   
    $.ajax({
      url: '/couponApply',
      data: {
        coupon: couponCode,
        total: couponTotal
      },
      method: 'post',
      success: (response) => {
        alert(response.couponSuccess)
        if (response.couponSuccess) {
          let oldTotal = parseInt(document.getElementById('couponTotal').value)

          let discount = oldTotal - parseInt(response.total)

          document.getElementById('couponInput').readOnly = true

          document.getElementById('totalWithCoupon').innerHTML = '₹' + response.total
          document.getElementById('discount').innerHTML = '₹' + discount
          document.getElementById('paidAmount').innerHTML = '₹' + (parseInt(response.total) + 40)

          document.getElementById('code').value = couponCode
          document.getElementById('discountedPrice').value = discount
          document.getElementById('MainTotal').value = response.total
          document.getElementById('amountToBePaid').value = parseInt(response.total) + 40

          $("#discountspan").html(parseInt(discount))
          $('#discountspan').show()
          $('#discountLabel').show()
          $('#discounttd').show()
          $('#newTotal').show()
          $('#tdTotal').show()
          $('#totalOriginal').show()

          document.getElementById('grandTotal').innerHTML = '₹' + response.total
          $('#couponSuccess').show()
          $('#couponUsed').hide()
          $('#couponInvalid').hide()  
          $('#couponExpired').hide()
          $('#couponMaxLimit').hide()
        }

        if (response.couponUsed) {
          $('#couponUsed').show()
          $('#couponSuccess').hide()
          $('#couponInvalid').hide()
          $('#couponExpired').hide()
          $('#discountspan').hide()
          $('#discountLabel').hide()
          $('#couponMaxLimit').hide()
        }
        if (response.invalidCoupon) {
          $('#couponInvalid').show()
          $('#couponSuccess').hide()
          $('#couponUsed').hide()
          $('#couponExpired').hide()
          $('#discountspan').hide()
          $('#discountLabel').hide()
          $('#couponMaxLimit').hide()
        }
        if (response.couponExpired) {
          $('#couponExpired').show()
          $('#couponSuccess').hide()
          $('#couponInvalid').hide()
          $('#couponUsed').hide()
          $('#discountspan').hide()
          $('#discountLabel').hide()
          $('#couponMaxLimit').hide()
        }
        if (response.couponMaxLimit) {
          $('#couponMaxLimit').show()
          $('#couponExpired').hide()
          $('#couponSuccess').hide()
          $('#couponInvalid').hide()
          $('#couponUsed').hide()
          $('#discountspan').hide()
          $('#discountLabel').hide()
        }
      }
    })
  }
        var subcategory = {
            MEN: ["T-shirt", "Shirt", "Jacket"],
            WOMEN: ["Saree","T-shirts", "Shirts"]


        }

        function makeSubmenu(value) {
            if (value.length == 0) document.getElementById("categorySelect").innerHTML = "<option></option>";
            else {
                var citiesOptions = "";
                for (categoryId in subcategory[value]) {
                    citiesOptions += "<option>" + subcategory[value][categoryId] + "</option>";
                }
                document.getElementById("categorySelect").innerHTML = citiesOptions;
            }
        }

        

        function resetSelection() {
            document.getElementById("category").selectedIndex = 0;
            document.getElementById("categorySelect").selectedIndex = 0;
        }
    

