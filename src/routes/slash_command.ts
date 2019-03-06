import express from 'express';
import { WebClient, Dialog } from '@slack/client';

const router = express.Router();

router.post('/', (req, res) => {
  res.send();
  const web = new WebClient(process.env.BOT_TOKEN);
  let title = '';
  if (req.body.text !== '') {
    title = req.body.text;
  }

  const dialog: Dialog = {
    callback_id: 'dialog_create_new',
    title: 'Report breaking news',
    submit_label: 'Report',
    notify_on_cancel: true,
    elements: [
      {
        label: 'Story title',
        name: 'title',
        type: 'text',
        placeholder: 'Title for this story',
        value: title,
      },
      {
        label: 'Desk',
        name: 'product',
        type: 'select',
        options: [
          {
            label: 'National',
            value: 'national',
          },
          {
            label: 'Local',
            value: 'local',
          },
          {
            label: 'Politics',
            value: 'politics',
          },
          {
            label: 'Brexit',
            value: 'brexit',
          },
        ],
        placeholder: 'Choose the relevant desk',
      },
      {
        label: 'Point person',
        name: 'point_person',
        type: 'select',
        data_source: 'users',
      },
      {
        label: 'What\'s happening?',
        name: 'synopsis',
        type: 'textarea',
        optional: true,
      },
    ],
  };
  web.dialog.open({ dialog, trigger_id: req.body.trigger_id }).catch((reason) => { console.log(reason); });
});

export default router;
