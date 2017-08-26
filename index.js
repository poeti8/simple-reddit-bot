const Telegraf = require('telegraf');
const { Markup } = require('telegraf');
const app = new Telegraf(YOUR_TOKEN);
const axios = require('axios'); // add axios

let state = {};

app.hears('hi', ctx => {
  return ctx.reply('Hey!');
});

app.command('top', ctx => {
  const userId = ctx.message.from.id;
  if (!state[userId])
    state[userId] = {};
  state[userId].command = 'top';
  return ctx.replyWithMarkdown(`Enter a subreddit name to get *top* posts.`);
});

app.command('hot', ctx => {
  const userId = ctx.message.from.id;
  if (!state[userId])
    state[userId] = {};
  state[userId].command = 'hot';
  return ctx.replyWithMarkdown('Enter a subreddit name to get *hot* posts.');
});

app.on('text', ctx => {
  const subreddit = ctx.message.text;
  const userId = ctx.message.from.id;
  const type = !state[userId] ? 
    'top' : 
    state[userId].command ? 
      state[userId].command : 
      'top';

  if (!state[userId])
    state[userId] = {};
  state[userId].index = 0;

  axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`)
    .then(res => {
      const data = res.data.data;
      if (data.children.length < 1)
        return ctx.reply('The subreddit couldn\'t be found.');

      const link = `https://reddit.com/${data.children[0].data.permalink}`;
      console.log('test')
      return ctx.reply(link,
        Markup.inlineKeyboard([
          Markup.callbackButton('➡️ Next', subreddit),
        ]).extra()
      );
    })
    .catch(err => console.log(err));
});

app.on('callback_query', ctx => {
  const subreddit = ctx.update.callback_query.data;
  const userId = ctx.update.callback_query.from.id;
  
  let type;
  let index;
  try {
    type = state[userId].command ? state[userId].command : 'top';
    index = state[userId].index;
  } catch (err) {
    return ctx.reply('Send a subreddit name.');
  }

  ctx.answerCallbackQuery('Wait...');
  
  axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`)
    .then(res => {
      const data = res.data.data;
      if (!data.children[index + 1])
        return ctx.reply('No more posts!');

      const link = `https://reddit.com/${data.children[index + 1].data.permalink}`;
      state[userId].index = state[userId].index + 1;
      return ctx.reply(link,
        Markup.inlineKeyboard([
          Markup.callbackButton('➡️ Next', subreddit),
        ]).extra()
      );
    })
    .catch(err => console.log(err));
});

app.startPolling();
