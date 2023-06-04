const ctx = document.getElementById("chart").getContext("2d");
let chart = null;

const storageRange = document.getElementById("storageRange");
const storageRangeValue = document.getElementById("storageRangeValue");
const transferRange = document.getElementById("transferRange");
const transferRangeValue = document.getElementById("transferRangeValue");
const hddRadio = document.getElementById("hddRadio");
const ssdRadio = document.getElementById("ssdRadio");
const singleRadio = document.getElementById("singleRadio");
const multiRadio = document.getElementById("multiRadio");

const providers = [
  {
    name: "backblaze",
    storagePrice: 0.005,
    transferPrice: 0.01,
    minPayment: 7,
    logo: "img/backblaze.png",
    getTotalPrice(storageValue, transferValue) {
      let total =
        this.storagePrice * storageValue + this.transferPrice * transferValue;
      return total < this.minPayment ? this.minPayment : total;
    },
  },
  {
    name: "bunny",
    storagePriceHDD: 0.01,
    storagePriceSSD: 0.02,
    transferPrice: 0.01,
    maxPayment: 10,
    logo: "img/bunny.svg",
    getTotalPrice(storageValue, transferValue) {
      let total;
      if (hddRadio.checked) {
        total =
          this.storagePriceHDD * storageValue +
          this.transferPrice * transferValue;
      } else if (ssdRadio.checked) {
        total =
          this.storagePriceSSD * storageValue +
          this.transferPrice * transferValue;
      }

      return total > this.maxPayment ? this.maxPayment : total;
    },
  },
  {
    name: "scaleway",
    storagePriceSingle: 0.03,
    storagePriceMulti: 0.06,
    transferPrice: 0.02,
    discountGB: 75,
    logo: "img/scaleway.png",
    getTotalPrice(storageValue, transferValue) {
      let total;
      storageValue = Math.max(storageValue - this.discountGB, 0);
      transferValue = Math.max(transferValue - this.discountGB, 0);

      if (singleRadio.checked) {
        total =
          this.storagePriceSingle * storageValue +
          this.transferPrice * transferValue;
      } else if (multiRadio.checked) {
        total =
          this.storagePriceMulti * storageValue +
          this.transferPrice * transferValue;
      }

      return total > 0 ? total : 0;
    },
  },
  {
    name: "vultr",
    storagePrice: 0.01,
    transferPrice: 0.01,
    minPayment: 5,
    logo: "img/vultr.webp",
    getTotalPrice(storageValue, transferValue) {
      let total =
        this.storagePrice * storageValue + this.transferPrice * transferValue;
      return total < this.minPayment ? this.minPayment : total;
    },
  },
];

const getMinPrice = () => {
  return Math.min.apply(
    null,
    providers.map((provider) =>
      provider.getTotalPrice(storageRange.value, transferRange.value)
    )
  );
};

const updateChart = () => {
  const storageSize = storageRange.value;
  const transferSize = transferRange.value;

  if (chart != null) {
    chart.destroy();
  }

  const data = {
    labels: providers.map((provider) => provider.name),
    datasets: [
      {
        label: "Price per month",
        data: providers.map((provider) =>
          provider.getTotalPrice(storageSize, transferSize)
        ),
        backgroundColor: providers.map((provider) => {
          return provider.getTotalPrice(storageSize, transferSize) ===
            getMinPrice()
            ? "green"
            : "gray";
        }),
        barThickness: window.innerWidth < 768 ? 30 : 50,
      },
    ],
  };

  const logoPlugin = {
    id: "logoPlugin",
    afterDraw: (chart) => {
      const { ctx, data, chartArea } = chart;
      const { datasets, labels } = data;

      datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        const { data: barData } = meta;
        const logoUrls = providers.map((provider) => provider.logo);
        barData.forEach((bar, index) => {
          const logoUrl = logoUrls[index];

          const img = new Image();
          img.src = logoUrl;
          img.onload = () => {
            const logoSize = window.innerWidth < 768 ? 20 : 40;
            const x =
              window.innerWidth < 768 ? bar.x - logoSize / 2 : bar.x + 5;
            const y =
              window.innerWidth < 768
                ? bar.y - logoSize - 5
                : bar.y - logoSize / 2;
            ctx.drawImage(img, x, y, logoSize, logoSize);
          };
        });
      });
    },
  };

  const options = {
    indexAxis: window.innerWidth < 768 ? "x" : "y",
    layout: {
      padding: window.innerWidth < 768 ? 30 : 50,
    },
    plugins: {
      legend: {
        display: false,
      },
      logoPlugin: logoPlugin,
    },
  };

  Chart.register(logoPlugin);

  chart = new Chart(ctx, {
    type: "bar",
    data,
    options,
  });
};

storageRange.addEventListener("input", () => {
  storageRangeValue.textContent = storageRange.value + " GB";
  updateChart();
});

transferRange.addEventListener("input", () => {
  transferRangeValue.textContent = transferRange.value + " GB";
  updateChart();
});

window.addEventListener("resize", updateChart);

updateChart();
