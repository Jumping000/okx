class StrategyExpressionHandler {
    constructor(store) {
      this.store = store; // pinia store注入
    }
  
    test(){
        console.log('test')
        console.log(this.store);
    }
  }

  export default StrategyExpressionHandler;