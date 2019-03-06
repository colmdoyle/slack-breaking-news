import express from 'express';
import { WebClient } from '@slack/client';

const router = express.Router();

const owners: any = {
  national: ['U9UFK54EA'],
  local: ['U9UFK54EA'],
  politics: ['U9UFK54EA'],
  brexit: ['U9UFK54EA'],
};

router.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  res.send();
  switch (payload.type) {
    case 'dialog_submission':
      handleDialogSubmission(payload);
      break;
    case 'block_actions':
      handleBlockAction(payload);
      break;
    default:
      console.log(payload);
      break;
  }
});

// tslint:disable-next-line:completed-docs
function handleBlockAction(payload: any): void {
  const webUser = new WebClient(process.env.USER_TOKEN);
  const botUser = new WebClient(process.env.BOT_TOKEN);

  console.log(payload);
  const action = payload.actions[0];
  const channelID = payload.container.channel_id;
  const messageTS = payload.container.message_ts;
  const blocks = payload.message.blocks;
  blocks[3].elements.pop();
  blocks[1].fields.push({
    type: 'mrkdwn',
    // tslint:disable-next-line:max-line-length
    text: `*All Clear*\n <!date^${Math.round(Date.now() / 1000)}^{date_short} at {time_secs}|${Math.round(Date.now() / 1000)}>`,
  });
  if (action.value === 'all_clear') {
    botUser.chat.update({
      blocks,
      channel: channelID,
      ts: messageTS,
      text: 'A breaking news alert has been declared',
    });
  }
  webUser.pins.list({ channel: payload.container.channel_id }).then((pinsResponse: any) => {
    const blocks: any = [];
    pinsResponse.items.reverse().forEach((pin: any) => {
      const timestamp = pin.message.ts.split('.')[0];
      console.log(timestamp);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          // tslint:disable-next-line:max-line-length
          text: `<!date^${timestamp}^{date_short_pretty} at {time_secs}^${pin.message.permalink}|${timestamp}> [<@${pin.created_by}>] ${pin.message.text}`,
        },
      },
      );
    });
    if (action.value === 'all_clear') {
      blocks.unshift(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            // tslint:disable-next-line:max-line-length
            text: `:white_check_mark: *The all clear has been given by <@${payload.user.id}>* \n A summary of important messages from the story is below`,
          },
        },
        {
          type: 'divider',
        },
      );
      botUser.chat.postMessage(
        {
          blocks,
          channel: payload.container.channel_id,
          text: 'This story is all clear',
        },
      ).then((postedmessage: any) => {
        botUser.pins.add({ channel: postedmessage.channel, timestamp: postedmessage.ts });
      });
    } else if (action.value === 'summary') {
      blocks.unshift(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'A summary of important messages from the story is below',
          },
        },
        {
          type: 'divider',
        },
      );
      botUser.chat.postEphemeral(
        {
          blocks,
          channel: payload.container.channel_id,
          text: 'Summary of story',
          user: payload.user.id,
        },
      );
    }
  });
}

// tslint:disable-next-line:completed-docs
function handleDialogSubmission(payload: any): void {
  console.log('=======================================================');
  console.log(JSON.stringify(payload, null, 2));
  const webUser = new WebClient(process.env.USER_TOKEN);
  const botUser = new WebClient(process.env.BOT_TOKEN);
  const botUserID = process.env.BOT_USER_ID as string;
  const incidentDetails = payload.submission;
  const incidentNumber = Math.floor(Math.random() * 1000000) + 1;
  const comments = incidentDetails.comment || 'None';

  webUser.channels.create({ name: `breaking-${incidentNumber}` }).then((response: any) => {
    const incidentMessage: any = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:rotating_light: *[BREAKING-${incidentNumber}] A breaking news alert has been opened by <@${payload.user.id}>*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Desk*\n ${incidentDetails.product}`,
          },
          {
            type: 'mrkdwn',
            text: `*point_person*\n<@${incidentDetails.point_person}>`,
          },
          {
            type: 'mrkdwn',
            text: `*Title*\n${incidentDetails.title}`,
          },
          {
            type: 'mrkdwn',
            text: `*Channel*\n<#${response.channel.id}>`,
          },
          {
            type: 'mrkdwn',
            // tslint:disable-next-line:max-line-length
            text: `*Story started*\n<!date^${Math.round(Date.now() / 1000)}^{date_short} at {time_secs}|${Math.round(Date.now() / 1000)}>`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Comments*\n${comments}`,
        },
      },
    ];
    botUser.chat.postMessage(
      {
        channel: process.env.INCIDENTS_CHANNEL as string,
        text: 'A breaking news alert has been opened',
        blocks: incidentMessage,
      },
    );
    botUser.chat.postMessage(
      {
        channel: incidentDetails.point_person,
        // tslint:disable-next-line:max-line-length
        text: `You have been declared the point_person for <#${response.channel.id}>. I've already invited you to the channel, but you should get involved ASAP.`,
        as_user: true,
      },
    );
    owners[incidentDetails.product].forEach((element: string) => {
      botUser.chat.postMessage(
        {
          channel: element as string,
          text: 'A breaking news alert has been opened',
          blocks: incidentMessage,
          as_user: true,
        },
      );
    });
    if (incidentDetails.point_person !== payload.user.id) {
      webUser.channels.invite({ channel: response.channel.id, user: incidentDetails.point_person });
    }
    webUser.channels.invite({ channel: response.channel.id, user: botUserID }).then(() => {
      incidentMessage.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Summary',
            },
            value: 'summary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: ':white_check_mark: All Clear',
            },
            value: 'all_clear',
          },
        ],
      });
      botUser.chat.postMessage(
        {
          channel: response.channel.id,
          text: 'An breaking news alert has been opened',
          blocks: incidentMessage,
        },
      ).then((postedmessage: any) => {
        botUser.pins.add({ channel: postedmessage.channel, timestamp: postedmessage.ts });
      });
    });
  });

}

export default router;
