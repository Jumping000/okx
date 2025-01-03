import { defineStore } from "pinia";
import { getAccountInstruments } from "@/api/module/Basics";

export const useCurrencyStore = defineStore("currency", {
  state: () => ({
    currencies: {
      // 合约
      SWAP: [],
      // 现货
      SPOT: [],
    },
    loading: false,
    error: null,
    lastUpdateTime: null,
  }),

  getters: {
    getCurrencyByName: (state) => (type, name) => {
      return state.currencies[type].find(
        (currency) => currency.instId === name
      );
    },

    // 获取所有可用的币种
    availableCurrencies: (state) => {
      return state.currencies.filter(
        (currency) => currency.canDep && currency.canWd
      );
    },
  },

  actions: {
    async fetchCurrencies() {
      if (this.loading) return;

      this.loading = true;
      this.error = null;

      try {
        // const response = await getAssetCurrencies();
        // 合约
        const HY = await getAccountInstruments({
          instType: "SWAP",
        });
        // 现货
        const BB = await getAccountInstruments({
          instType: "SPOT",
        });
        // 循环 HY\BB instId 要 包含USDT

        if (HY.code === "0" && BB.code === "0") {
          this.currencies = {
            SWAP: [],
            SPOT: [],
          };
          HY.data.forEach((item) => {
            if (item.instId.includes("USDT")) {
              this.currencies.SWAP.push(item);
            }
          });
          BB.data.forEach((item) => {
            if (item.instId.includes("USDT")) {
              this.currencies.SPOT.push(item);
            }
          });
          this.lastUpdateTime = new Date().toISOString();
        } else {
          throw new Error(HY.msg || BB.msg || "获取币种列表失败");
        }
      } catch (error) {
        console.error("获取币种列表失败:", error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
