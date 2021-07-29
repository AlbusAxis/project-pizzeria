/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
      active: '.product.active'
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };
  class Product {
    constructor(id, data) {
      this.id = id;
      this.data = data;
      this.dom = {};
      this.renderInMenu();
      this.getElements();
      this.initAccordion();
      this.initOrderForm();
      this.initAmountWidget();
      this.processOrder();
    }
    prepareCartProductParams() { // ??
      const thisProduct = this;
    
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
    
      // for very category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
    
        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };

        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
    
          if(optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
    
      return params;
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {
        params: thisProduct.prepareCartProductParams(),
        id: thisProduct.id,
        name: thisProduct.name,
        amount: thisProduct.amount,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.price,
      };

      return productSummary;
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    renderInMenu(){
      const thisProduct = this;
      /* generate HTML based on template */
      const generateHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generateHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
  
    initAccordion(){
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      // const clickableTrigger = select.menuProduct.clickable;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
      /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.menuProduct.active);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct && activeProduct != thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);   
        }

        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive); 
      });

    }
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    }
    initOrderForm(){
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
      thisProduct.amountWidgetElem.addEventListener('update', function(){
        thisProduct.processOrder();
      });
    }
    processOrder() {
      const thisProduct = this;
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);
    
      // set price to default price
      let price = thisProduct.data.price;
      
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        console.log(paramId, param);
    
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          console.log(optionId, option);
          // check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId] && formData[paramId].includes(optionId)) {
            // check if the option is not default
            if(!option.default) {
              // add option price to price variable
              price += option.price;}
          }else {
            // check if the option is default
            if(option.default) {
              // reduce price variable
              price -= option.price;}
          }

          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
      
          if (optionImage === null) {
            console.log('optionImage:', optionImage);
          }
        }
      }
      
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.priceSingle;
      thisProduct.priceElem.innerHTML = price;
    }
  }
  class AmountWidget {
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.dom.input.value || settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element) {
      this.dom = {};
      this.dom.wrapper = element;
      this.dom.input = this.dom.wrapper.querySelector(select.widgets.amount.input);
      this.dom.linkDecrease = this.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
      this.dom.linkIncrease = this.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      let newValue = parseInt(value);
      const minValue = settings.amountWidget.defaultMin; // 1
      const maxValue = settings.amountWidget.defaultMax; // 10
    
      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        if(newValue < minValue) newValue = minValue;
        if(newValue > maxValue) newValue = maxValue;
        thisWidget.value = newValue;
      }

      thisWidget.dom.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;
      thisWidget.dom.input.addEventListener('change', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.dom.input.value);
      });
      thisWidget.dom.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.dom.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
    }
    
    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = element.querySelector(select.cart.subTotalPrice);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    }

    initActions(){ // Wrapper 
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove();
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    

    add (menuProduct){
      const thisCart = this;
      
      const generateHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generateHTML);
      const cartContainer = document.querySelector(select.containerOf.cart);
      cartContainer.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    }

    update(){
      const thisCart = this;

      thisCart.subTotalPrice = 0;
      thisCart.totalPrice = 0;
      thisCart.deliveryFee = 0;

      for (let product of thisCart.products) {
        thisCart.subTotalPrice += product.price;
        thisCart.totalNumber += product.amount;
      }

      if(thisCart.totalNumber > 0) thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalPrice = thisCart.subTotalPrice + thisCart.deliveryFee;

      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subTotalPrice;
      for (let total of this.dom.totalPrice){
        total.innerHTML = thisCart.totalPrice;
      }
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    }

    remove(){
      const thisCart = this;
      const event = new CustomEvent('remove',{
        bubbles: true,
        detail: {
          Cart: thisCart,
        },
      });
      thisCart.event.detail.cartProduct.innerHTML(event);
      thisCart.splice(thisCart.products);
      thisCart.update();
    }
    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      payload.products = {};
    }
  }
  
  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.getElements(element);
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom = thisCartProduct.dom.wrapper(element);
      thisCartProduct.dom = thisCartProduct.dom.wrapper(select.menuProduct.amountWidget.generateHTML);
      thisCartProduct.dom = thisCartProduct.dom.wrapper(select.menuProduct.price);
      thisCartProduct.dom = thisCartProduct.dom.wrapper(select.menuProduct.edit);
      thisCartProduct.dom = thisCartProduct.dom.wrapper(select.menuProduct.remove); 
    }
    
    AmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.amountWidgetElem);
      thisCartProduct.amountWidget.addEventListener('click', function(){
        thisCartProduct.price *= thisCartProduct.priceSingle;
      });
    }
    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove',{
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        event();
      });
    }
    

  }



  
  const app = {
    initMenu: function(){
      const thisApp = this;
      for (let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      console.log('thisApp.data:', thisApp.data);
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse:', parsedResponse);
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });
     
      
      console.log('thisApp.data', JSON.stringify(thisApp.data));

    },
    
    init: function() {
      const thisApp = this;
      thisApp.initData();   
      thisApp.initCart();
      
    },
    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };
  app.init();
}