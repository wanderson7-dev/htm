// Variable that controls the current step
let currentStep = 1;

// Global object to store collected data (optional, for use in Step 4)
let formData = {};

/**
 * Displays only the current step and updates the sidebar
 * @param {number} step - step number to display
 */
function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach((el) => {
    el.classList.remove('active');
  });
  // Remove the active class from all sidebar items
  document.querySelectorAll('.step-item').forEach((item) => {
    item.classList.remove('active');
  });

  // Display only the desired step
  const stepToShow = document.querySelector(`.form-step[data-step="${step}"]`);
  if (stepToShow) {
    stepToShow.classList.add('active');
  }

  // Update the corresponding sidebar item
  const stepSidebar = document.querySelector(`.step-item[data-step="${step}"]`);
  if (stepSidebar) {
    stepSidebar.classList.add('active');
  }
}

/**
 * Advances to the next step of the wizard.
 * - If it's step 1, sends data to the webhook and stores the data.
 * - If it is step 3 and advancing to 4, dynamically fills in the confirmation data.
 */
function nextStep() {
  if (currentStep === 1) {
    // Capture the values from the fields in step 1
    const codigo = document.getElementById("codigoTransacao").value.trim();
    const email = document.getElementById("emailCompra").value.trim();

    if (!codigo || !email) {
      alert("Please fill in the transaction code and email.");
      return;
    }

    // Generate a unique random 6-digit number
    const randomCode = Math.floor(100000 + Math.random() * 900000);

    // Store the data for later use (optional)
    formData = {
      codigoTransacao: codigo,
      email: email,
      uniqueCode: randomCode
    };

    // Update the status to indicate that the sending is in progress
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "Sending data...";

    // Send the data to the webhook via fetch using no-cors
    fetch("https://n8n.seven-health.fun/webhook/passo1", {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(formData)
    })
    .then(() => {
      // Since the response is opaque (no-cors), assume success if no error occurs
      statusDiv.textContent = "Data sent successfully!";
      currentStep++;
      showStep(currentStep);
    })
    .catch(error => {
      console.error("Error:", error);
      statusDiv.textContent = "Error sending data. Please check your connection.";
    });
  } else {
    if (currentStep < 5) {
      currentStep++;
      showStep(currentStep);
      // If advancing to Step 4, fill in the confirmation data (if needed)
      if (currentStep === 4) {
        fillConfirmationData();
      }
    }
  }
}

/**
 * Returns to the previous step of the wizard
 */
function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

/**
 * Function to confirm the security code (Step 2)
 * - The "Confirm" button is enabled only when the field has exactly 6 digits.
 */
function confirmarSeguranca() {
  const codigoSeg = document.getElementById('codigoSeguranca').value.trim();
  if (!codigoSeg) {
    alert("Please enter the security code.");
    return;
  }
  // If everything is ok, proceed to the next step
  nextStep();
}

/**
 * Function to fill in the confirmation data in Step 4.
 * Here you can dynamically insert the data collected from the previous steps.
 */
function fillConfirmationData() {
  // Example: inserts data stored in formData into elements in Step 4
  if (formData) {
    const confCodigo = document.getElementById('confCodigo');
    const confEmail = document.getElementById('confEmail');
    const confUnique = document.getElementById('confUniqueCode');
    if (confCodigo) confCodigo.textContent = formData.codigoTransacao;
    if (confEmail) confEmail.textContent = formData.email;
    if (confUnique) confUnique.textContent = formData.uniqueCode;
  }
}

/**
 * On page load, display step 1 and set up the listener for the security field
 */
document.addEventListener('DOMContentLoaded', () => {
  showStep(currentStep);

  // Listener to enable the "Confirm" button only when the field has exactly 6 numeric digits
  const codigoSegInput = document.getElementById('codigoSeguranca');
  if (codigoSegInput) {
    codigoSegInput.addEventListener('input', function() {
      const btnConfirmar = document.getElementById('btnConfirmar');
      if (/^\d{6}$/.test(this.value.trim())) {
        btnConfirmar.disabled = false;
      } else {
        btnConfirmar.disabled = true;
      }
    });
  }
});

/**
 * Function to send the email and transaction code again to the new webhook
 * when clicking "Submit Request" in Step 5
 * (Called after confirmation in the popup)
 */
function enviarSolicitacao() {
  // Assemble the data with email and transaction code
  const dataToSend = {
    codigoTransacao: formData.codigoTransacao,
    email: formData.email
  };

  // Send to the second webhook
  fetch("https://n8n.seven-health.fun/webhook/etapa2", {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(dataToSend)
  })
  .then(() => {
    // Success (opaque response due to no-cors)
    exibirTelaSucesso(); // Replace the entire content with the final message
  })
  .catch(error => {
    console.error("Error:", error);
    alert("Error sending the request.");
  });
}

/**
 * Displays the confirmation modal
 */
function abrirModal() {
  const modal = document.getElementById('modalReembolso');
  if (modal) {
    modal.style.display = 'block';
  }
}

/**
 * Closes the confirmation modal
 */
function fecharModal() {
  const modal = document.getElementById('modalReembolso');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Confirms the refund: closes the modal and sends data to the webhook
 */
function confirmarReembolso() {
  fecharModal(); // Hide the modal
  enviarSolicitacao(); // POST data and then display the success screen
}

/**
 * Adjustment in Step 5:
 * Instead of calling enviarSolicitacao() directly on the button,
 * we call abrirModal().
 */
function enviarSolicitacaoModal() {
  abrirModal();
}

/**
 * Replaces the entire page content with the success message
 */
function exibirTelaSucesso() {
  // Replace the entire BODY with a final screen
  document.body.innerHTML = `
    <header class="top-bar">
      <div class="logo-container">
        <img src="logo-header.svg" alt="Logo">
      </div>
    </header>
    <div style="max-width: 600px; margin: 40px auto; text-align: left; padding: 20px;">
      <p style="font-size: 2.5rem; font-weight: 300;">Your refund has been successfully requested!</p><br>
      <p style="font-size: 1.25rem; font-weight: 300;">
        You will receive the amount within 15 business days in the original account.
      </p>
    </div>
  `;
}
