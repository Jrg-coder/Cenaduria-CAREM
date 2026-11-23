(function () {
  const cart = [];
  const cartList = document.getElementById("cart-list");
  const orderForm = document.getElementById("order-form");
  const mainNumber = "529711559298";
  const deliveryFee = 15;
  const deliveryType = document.getElementById("delivery-type");
  const deliveryDetails = document.getElementById("delivery-details");
  const addressField = document.getElementById("customer-address");
  const locationButton = document.getElementById("get-location");
  const clearLocationButton = document.getElementById("clear-location");
  const locationStatus = document.getElementById("location-status");
  const changeAmount = document.getElementById("change-amount");
  const changeError = document.getElementById("change-error");
  let locationUrl = "";
  let locationPending = false;
  let locationRequest = 0;
  const waterSelect = document.getElementById("water-choice");
  const waterQuantity = document.getElementById("water-quantity");
  const waterOfDayFlavor = document.getElementById("water-of-day-flavor");
  const cartFeedback = document.getElementById("cart-feedback");
  let feedbackTimer;
  const waterPrice = 25;
  const currency = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  });

  function getProductPrice(product, portion, size) {
    if (product === "Gordita") {
      if (portion === "Sencillo de quesillo") {
        return { amount: 35, unit: "orden", piecesPerUnit: 5 };
      }
      if (portion === "Sencillo de carne") {
        return { amount: 10, unit: "pieza", piecesPerUnit: 1 };
      }
      if (portion === "Doble") {
        return { amount: 15, unit: "pieza", piecesPerUnit: 1 };
      }
      throw new Error("No hay precio configurado para la porción seleccionada.");
    }

    if (product === "Tostada") {
      if (portion === "Sencillo de quesillo") {
        return { amount: 20, unit: "orden", piecesPerUnit: 3 };
      }
      if (portion === "Sencillo de carne") {
        return { amount: 10, unit: "pieza", piecesPerUnit: 1 };
      }
      if (portion === "Doble") {
        return { amount: 15, unit: "pieza", piecesPerUnit: 1 };
      }
      throw new Error("No hay precio configurado para la porción seleccionada.");
    }

    if (product === "Garnacha") {
      return { amount: 35, unit: "orden", piecesPerUnit: 5 };
    }

    if (product === "Tlayuda") {
      const prices = {
        "Sencillo de quesillo Mediano": 65,
        "Sencillo de quesillo Grande": 80,
        "Sencillo de carne Mediano": 65,
        "Sencillo de carne Grande": 80,
        "Doble Mediano": 80,
        "Doble Grande": 100
      };
      return { amount: prices[portion + " " + size], unit: "pieza", piecesPerUnit: 1 };
    }

    throw new Error("No hay precio configurado para el producto seleccionado.");
  }

  function updateDeliveryFields() {
    const isDelivery = deliveryType.value === "Entrega a domicilio";
    deliveryDetails.classList.toggle("hidden", !isDelivery);
    addressField.required = isDelivery;
    if (!isDelivery) {
      addressField.value = "";
      clearLocation();
    }
    renderCart();
  }

  function clearLocation() {
    locationRequest++;
    locationUrl = "";
    locationPending = false;
    locationButton.disabled = false;
    clearLocationButton.classList.add("hidden");
    locationStatus.textContent = "";
  }

  function getCurrentLocation() {
    clearLocation();
    if (!window.isSecureContext || !navigator.geolocation) {
      locationStatus.textContent = "La ubicación no está disponible. Usa una conexión HTTPS y escribe tu domicilio.";
      return;
    }

    const request = ++locationRequest;
    locationPending = true;
    locationButton.disabled = true;
    clearLocationButton.classList.remove("hidden");
    locationStatus.textContent = "Buscando tu ubicación. Permite el acceso si el navegador te lo solicita.";
    navigator.geolocation.getCurrentPosition(function (position) {
      if (request !== locationRequest) return;
      const coordinates = position.coords.latitude.toFixed(6) + "," + position.coords.longitude.toFixed(6);
      locationUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(coordinates);
      locationPending = false;
      locationButton.disabled = false;
      locationStatus.textContent = "Ubicación agregada (" + coordinates + "). Se incluirá en tu pedido.";
    }, function (error) {
      if (request !== locationRequest) return;
      locationPending = false;
      locationButton.disabled = false;
      clearLocationButton.classList.add("hidden");
      if (error.code === 1) {
        locationStatus.textContent = "No se permitió acceder a tu ubicación. Puedes autorizarla en el navegador o continuar con tu domicilio escrito.";
      } else if (error.code === 3) {
        locationStatus.textContent = "Se agotó el tiempo para obtener tu ubicación. Inténtalo de nuevo o continúa con tu domicilio escrito.";
      } else {
        locationStatus.textContent = "No se pudo obtener tu ubicación. Revisa el GPS e inténtalo de nuevo o continúa con tu domicilio escrito.";
      }
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function createWaterItem(quantity) {
    return {
      type: "water",
      product: "Agua fresca del día",
      flavor: waterOfDayFlavor.textContent.trim(),
      quantity: quantity,
      pieces: quantity,
      price: { amount: waterPrice, unit: "bolsa", piecesPerUnit: 1 },
      lineTotal: quantity * waterPrice
    };
  }

  function updateWaterChoice() {
    const wantsWater = waterSelect.value === "yes";
    waterQuantity.disabled = !wantsWater;
    const waterIndex = cart.findIndex(function (item) {
      return item.type === "water";
    });

    if (!wantsWater) {
      waterQuantity.value = "0";
      if (waterIndex !== -1) cart.splice(waterIndex, 1);
      renderCart();
      return;
    }

    if (Number(waterQuantity.value) < 1) waterQuantity.value = "1";
    updateWaterQuantity();
  }

  function updateWaterQuantity() {
    const waterIndex = cart.findIndex(function (item) {
      return item.type === "water";
    });
    if (waterIndex === -1 || !waterQuantity.validity.valid) return;
    const quantity = Number(waterQuantity.value);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    cart[waterIndex] = createWaterItem(quantity);
    renderCart();
  }

  function showButtonFeedback(button) {
    button.classList.add("is-pressed");
    window.setTimeout(function () {
      button.classList.remove("is-pressed");
    }, 500);
  }

  function showCartFeedback() {
    window.clearTimeout(feedbackTimer);
    cartFeedback.textContent = "Producto agregado a tu lista de compra.";
    feedbackTimer = window.setTimeout(function () {
      cartFeedback.textContent = "";
    }, 3500);
  }

  function addWaterToCart() {
    showButtonFeedback(document.getElementById("add-water-button"));
    if (waterSelect.value !== "yes") {
      waterQuantity.value = "0";
      waterQuantity.disabled = true;
      return;
    }
    if (!waterQuantity.reportValidity()) return;
    const quantity = Number(waterQuantity.value);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      waterQuantity.setCustomValidity("Ingresa una cantidad entera mayor que cero.");
      waterQuantity.reportValidity();
      waterQuantity.setCustomValidity("");
      return;
    }
    const waterIndex = cart.findIndex(function (item) {
      return item.type === "water";
    });
    const waterItem = createWaterItem(quantity);
    if (waterIndex === -1) cart.push(waterItem);
    else cart[waterIndex] = waterItem;
    renderCart();
    showCartFeedback();
  }

  function renderCart() {
    cartList.replaceChildren();
    if (cart.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-cart";
      empty.textContent = "Aún no agregas nada. ¡Elige algo rico!";
      cartList.appendChild(empty);
    } else {
      cart.forEach(function (item, index) {
        const row = document.createElement("div");
        row.className = "cart-item";
        const details = document.createElement("div");
        const title = document.createElement("strong");
        const itemCount = item.price.unit === "orden"
          ? item.quantity + " orden(es), " + item.pieces + " piezas"
          : item.price.unit === "bolsa"
            ? item.quantity + " bolsa(s)"
            : item.quantity + " pieza(s)";
        title.textContent = item.product + " · " + itemCount +
          (item.size ? " · " + item.size : "") +
          (item.portion ? " · " + item.portion : "");
        const options = document.createElement("small");
        options.textContent = [
          item.preparation,
          item.cabbage,
          item.sorrapa,
          item.salsa,
          item.salad,
          item.flavor
        ].filter(Boolean).join(" · ") + " · " + currency.format(item.lineTotal);
        details.append(title, options);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-button";
        remove.textContent = "Quitar";
        remove.setAttribute("aria-label", "Quitar " + item.product + " del pedido");
        remove.addEventListener("click", function () {
          cart.splice(index, 1);
          if (item.type === "water") {
            waterSelect.value = "no";
            waterQuantity.disabled = true;
            waterQuantity.value = "0";
          }
          renderCart();
        });

        row.append(details, remove);
        cartList.appendChild(row);
      });
    }
    updatePriceSummary();
    updateChangeValidation();
  }

  function getSubtotal() {
    return cart.reduce(function (sum, item) {
      return sum + item.lineTotal;
    }, 0);
  }

  function getDeliveryFee() {
    return cart.length > 0 && deliveryType.value === "Entrega a domicilio" ? deliveryFee : 0;
  }

  function updatePriceSummary() {
    const subtotal = getSubtotal();
    const fee = getDeliveryFee();
    document.getElementById("subtotal").textContent = currency.format(subtotal);
    document.getElementById("delivery-fee").textContent = currency.format(fee);
    document.getElementById("order-total").textContent = currency.format(subtotal + fee);
  }

  function updateChangeValidation() {
    const needsChange = orderForm.elements.payment.value === "Necesito cambio";
    const total = getSubtotal() + getDeliveryFee();
    const insufficient = needsChange && changeAmount.value !== "" && Number(changeAmount.value) < total;
    const message = insufficient
      ? "El monto debe ser igual o mayor al total de " + currency.format(total) + "."
      : "";
    changeAmount.setCustomValidity(message);
    changeError.textContent = message;
  }

  function resetOrder() {
    cart.length = 0;
    document.querySelectorAll(".menu-card[data-product]").forEach(function (card) {
      card.querySelectorAll("select").forEach(function (select) {
        select.selectedIndex = 0;
      });
      card.querySelector(".product-quantity").value = "1";
      const portionField = card.querySelector('select[id$="-count"]');
      if (portionField) portionField.dispatchEvent(new Event("change"));
    });
    waterSelect.value = "no";
    waterQuantity.value = "0";
    waterQuantity.disabled = true;
    document.getElementById("order-notes").value = "";
    orderForm.querySelector('input[name="payment"][value="Pago exacto"]').checked = true;
    changeAmount.value = "";
    changeAmount.required = false;
    document.getElementById("change-field").classList.add("hidden");
    renderCart();
    window.clearTimeout(feedbackTimer);
    cartFeedback.textContent = "WhatsApp se abrió. Recuerda enviar el mensaje.";
    feedbackTimer = window.setTimeout(function () {
      cartFeedback.textContent = "";
    }, 5000);
  }

  function readProduct(card) {
    const product = card.dataset.product;
    const portionField = card.querySelector('select[id$="-count"]');
    const sizeField = card.querySelector('select[id$="-size"]');
    const quantityInput = card.querySelector(".product-quantity");

    if (!quantityInput.reportValidity()) return null;

    const portion = portionField ? portionField.value : "";
    const size = sizeField ? sizeField.value : "";
    const price = getProductPrice(product, portion, size);
    const quantity = Number(quantityInput.value);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      quantityInput.setCustomValidity("Ingresa una cantidad entera mayor que cero.");
      quantityInput.reportValidity();
      quantityInput.setCustomValidity("");
      return null;
    }

    const pieces = quantity * price.piecesPerUnit;
    const getOption = function (suffix) {
      const field = card.querySelector('select[id$="-' + suffix + '"]');
      return field ? field.value : "";
    };
    return {
      product: product,
      size: size,
      portion: portion,
      preparation: getOption("preparation"),
      quantity: quantity,
      pieces: pieces,
      price: price,
      lineTotal: quantity * price.amount,
      cabbage: getOption("cabbage"),
      sorrapa: getOption("sorrapa"),
      salsa: getOption("salsa"),
      salad: getOption("salad")
    };
  }

  function formatOrderItem(item, index) {
    const amount = item.price.unit === "orden"
      ? item.quantity + " orden(es) de " + item.price.piecesPerUnit + " piezas (" + item.pieces + " piezas en total)"
      : item.price.unit === "bolsa"
        ? item.quantity + " bolsa(s)"
        : item.quantity + " pieza(s)";
    const choices = [
      item.size,
      item.portion,
      item.preparation,
      item.cabbage,
      item.sorrapa,
      item.salsa,
      item.salad,
      item.flavor
    ].filter(Boolean).join(", ");
    return (index + 1) + ". " + item.product + " — " + amount +
      (choices ? ", " + choices : "") +
      " × " + currency.format(item.price.amount) + " = " + currency.format(item.lineTotal) + ".";
  }

  document.querySelectorAll("input, textarea, select").forEach(function (field) {
    field.addEventListener("input", function () {
      if (field === waterQuantity && waterSelect.value === "yes") updateWaterQuantity();
      if (field === changeAmount) updateChangeValidation();
    });
    field.addEventListener("change", function () {
      if (field === deliveryType) updateDeliveryFields();
      if (field === waterSelect) updateWaterChoice();
      if (field === waterQuantity && waterSelect.value === "yes") updateWaterQuantity();
    });
  });

  locationButton.addEventListener("click", getCurrentLocation);
  clearLocationButton.addEventListener("click", function () {
    clearLocation();
    locationStatus.textContent = "Ubicación eliminada del pedido.";
  });
  document.getElementById("add-water-button").addEventListener("click", addWaterToCart);

  document.querySelectorAll(".menu-card[data-product]").forEach(function (card) {
    const portionField = card.querySelector('select[id$="-count"]');
    const quantityLabel = card.querySelector('label[for$="-pieces"]');
    const dialog = card.querySelector(".product-dialog");

    card.querySelector(".dish-button").addEventListener("click", function () {
      dialog.showModal();
      document.body.classList.add("modal-open");
    });
    dialog.querySelector(".dialog-close").addEventListener("click", function () {
      dialog.close();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener("close", function () {
      if (!document.querySelector(".product-dialog[open]")) {
        document.body.classList.remove("modal-open");
      }
    });

    if (portionField && (card.dataset.product === "Gordita" || card.dataset.product === "Tostada")) {
      const updateQuantityLabel = function () {
        const price = getProductPrice(card.dataset.product, portionField.value);
        quantityLabel.textContent = price.unit === "orden"
          ? "Órdenes (" + price.piecesPerUnit + " piezas c/u)"
          : "Piezas";
      };
      portionField.addEventListener("change", updateQuantityLabel);
      updateQuantityLabel();
    }

    card.querySelector(".add-button").addEventListener("click", function () {
      showButtonFeedback(card.querySelector(".add-button"));
      const item = readProduct(card);
      if (!item) return;
      cart.push(item);
      renderCart();
      dialog.close();
      showCartFeedback();
    });
  });

  document.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      const needsChange = radio.value === "Necesito cambio" && radio.checked;
      document.getElementById("change-field").classList.toggle("hidden", !needsChange);
      changeAmount.required = needsChange;
      if (!needsChange) changeAmount.value = "";
      updateChangeValidation();
    });
  });

  orderForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (locationPending) {
      locationStatus.textContent = "Espera a que termine la búsqueda o quita la ubicación antes de continuar.";
      return;
    }
    if (cart.length === 0) {
      alert("Agrega al menos un producto antes de preparar tu pedido.");
      return;
    }

    const data = new FormData(orderForm);
    const subtotal = getSubtotal();
    const fee = getDeliveryFee();
    const total = subtotal + fee;
    const lines = [
      "Hola, quiero hacer este pedido:",
      "",
      ...cart.map(formatOrderItem),
      "",
      "Subtotal: " + currency.format(subtotal),
      "Comisión de entrega: " + currency.format(fee),
      "Total: " + currency.format(total),
      "Nombre: " + data.get("name"),
      "Teléfono: " + data.get("phone"),
      "Entrega: " + data.get("deliveryType"),
      ...(deliveryType.value === "Entrega a domicilio" ? [
        "Descripción del domicilio: " + data.get("address"),
        ...(locationUrl ? ["Ubicación en Google Maps: " + locationUrl] : [])
      ] : []),
      "Pago: " + data.get("payment") + (data.get("changeAmount") ? " con $" + data.get("changeAmount") : ""),
      "Notas: " + (data.get("notes") || "Ninguna"),
      "",
      "¿Me confirman el pedido y el tiempo de entrega? Gracias."
    ];
    const whatsappUrl = "https://wa.me/" + mainNumber + "?text=" + encodeURIComponent(lines.join("\n"));
    const whatsappWindow = window.open("", "_blank");
    if (!whatsappWindow) {
      alert("No se pudo abrir WhatsApp. Permite las ventanas emergentes e inténtalo de nuevo.");
      return;
    }
    whatsappWindow.opener = null;
    whatsappWindow.location.href = whatsappUrl;
    resetOrder();
  });

  updateDeliveryFields();
  updateWaterChoice();
}());
