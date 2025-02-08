
<template>
  <div id="app">
    <button @click="showMessage">Message</button>
  </div>
</template>

<script>
import  Message from './Message/message.js'
// import  {Message} from './Message/message.js'
import Vue from 'vue';
Vue.use(Message)
export default {
  name: 'app',

  data() {
    return {
      messages: []
    }
  },
  methods: {
    showMessage: function() {
      console.log(this.$messages)
      // Message.info({
      //   message: 'i am message', 
      //   duration: 3000
      // })
      this.$message.info({
        message: 'i am message', 
        duration: 3000
      })
    }
  }
}
</script>