const params = new URLSearchParams(window.location.search);
const assetCode = params.get("code");

fetch("asset-codes.json")
  .then(response => response.json())
  .then(data => {

    const asset = data.find(item => item.code === assetCode);

    if (!asset) {
      document.getElementById("pageTitle").innerText = "Asset Not Found";
      return;
    }

    document.getElementById("name").innerText = asset.name;
    document.getElementById("model").innerText = asset.model;
    document.getElementById("department").innerText = asset.department;
    document.getElementById("location").innerText = asset.location;
    document.getElementById("code").innerText = asset.code;
    document.getElementById("serial").innerText = asset.serial;
    document.getElementById("status").innerText = asset.status;

    document.getElementById("assetImage").src =
      "images/" + asset.code + ".jpg";

    document.getElementById("assetImage").alt =
      asset.name;

  })
  .catch(error => {
    console.error(error);
  });
