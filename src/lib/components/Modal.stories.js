// Stories for tools/look — screenshot with:
//   npm run look -- component Modal
export const Info = {
	props: {
		show: true,
		type: 'info',
		title: 'Backup Reminder',
		message: 'Your verses and progress are stored locally on this device. Please export your data regularly as a backup!'
	}
};

export const Confirm = {
	props: {
		show: true,
		type: 'confirm',
		title: 'Delete Collection',
		message: 'Are you sure you want to delete this collection? Your verses will not be deleted.'
	}
};

export const CustomButtons = {
	props: {
		show: true,
		type: 'info',
		title: 'Import Complete',
		message: '12 verses imported, 3 skipped.',
		buttons: [
			{ label: 'OK', action: 'ok', variant: 'primary' },
			{ label: 'View Log', action: 'log', variant: 'secondary' },
			{ label: 'Undo', action: 'undo', variant: 'danger' }
		]
	}
};
