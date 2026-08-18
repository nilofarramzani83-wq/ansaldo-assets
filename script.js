const params = new URLSearchParams(window.location.search);
const assetCode = params.get("code");
 
fetch("asset-codes.json")
  .then(response => response.json())
  .then(data => {

    const asset = data[assetCode];

    if (!asset) {
      document.getElementById("pageTitle").innerText = "کد نامعتبر";
      return;
    }

    document.getElementById("name").innerText = asset.name || "";
    document.getElementById("model").innerText =
      [asset.brand, asset.model].filter(Boolean).join(" ");
    document.getElementById("department").innerText = asset.currentOwner || "";
    document.getElementById("location").innerText = asset.location || "";
    document.getElementById("code").innerText = assetCode;
    document.getElementById("serial").innerText = asset.serial || "";
    document.getElementById("status").innerText = asset.status || "";

    document.getElementById("assetImage").src =
      "images/" + assetCode + ".jpg";

    document.getElementById("assetImage").alt = asset.name || "";

  })
  .catch(error => {
    console.error(error);
  });

