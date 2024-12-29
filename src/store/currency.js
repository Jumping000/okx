import { defineStore } from "pinia";
import { getAssetCurrencies } from "@/api/module/Basics";

export const useCurrencyStore = defineStore("currency", {
  state: () => ({
    currencies: [],
    loading: false,
    error: null,
    lastUpdateTime: null,
  }),

  getters: {
    getCurrencyByName: (state) => (name) => {
      return state.currencies.find((currency) => currency.ccy === name);
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
        const response = await getAssetCurrencies();
        if (response.code === "0") {
          this.currencies = response.data;
          this.lastUpdateTime = new Date().toISOString();
        } else {
          throw new Error(response.msg || "获取币种列表失败");
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
