
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
  function changeQuantity(cartId,proId,userId,count){
  let quantity=parseInt(document.getElementById(proId).innerHTML)
  count=parseInt(count)
  $.ajax({
    url:'/changeProductQuantity',
    data:{
      user:userId,
      cart:cartId,
      product:proId,
      count:count,
      quantity:quantity
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
    

