let profile_btn = document.getElementById('profile_btn');

profile_btn.addEventListener('click', async () => {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	chrome.scripting.executeScript(
		{
			target: { tabId: tab.id },
			func: collectData,
			args: [tab]
		},
		(injectedResults) => {
			const jsonData = injectedResults[0].result;
			let dataStr = JSON.stringify(jsonData);
			let dataUri =
				'data:application/json;charset=utf-8,' +
				encodeURIComponent(dataStr);
			let exportFileDefaultName = 'data.json';
			let linkElement = document.createElement('a');
			linkElement.setAttribute('href', dataUri);
			linkElement.setAttribute('download', exportFileDefaultName);
			linkElement.click();
		}
	);
});

// The body of this function will be executed as a content script inside the
// current page

function collectData(currentTab) {
	let data = { experience: [], education: [] };

	const name = document.getElementsByTagName('h1');
	const profile_pic = document.querySelectorAll('button img')[1];
	const tagLine = document.querySelectorAll('.pv-text-details__left-panel');
	const about = document.querySelector('#about');
	const experience = document.querySelector('#experience');
	const education = document.querySelector('#education');
	const companyName = document.querySelectorAll(
		'.pv-text-details__right-panel'
	)[0];

	data['profile_name'] = name[0].textContent.trim();
	data['profile_pic'] = profile_pic.src;
	data['profile_url'] = currentTab.url;
	data['company_name'] = companyName.textContent.trim();

	//About Section

	try {
		if (about) {
			data['about'] =
				about?.nextElementSibling?.nextElementSibling?.textContent.trim();
		} else {
			data['about'] = 'null';
		}
	} catch (err) {}

	// Tag Line section

	tagLine.forEach((tag, index) => {
		if (index === 0) {
			const x = tag.querySelectorAll('div')[1];
			data['designation'] = x.textContent.trim();
		}
		if (index === 1) {
			const x = tag.querySelectorAll('span')[0];
			data['location'] = x.textContent.trim();

			const contactNode = tag.children[1];
			const anchor = contactNode.querySelectorAll('a')[0];
			anchor.click();
			const modal = document.querySelectorAll('.ci-email')[0];
			try {
				if (modal) {
					data['email'] = modal.textContent.trim().slice(6).trim();
				} else {
					data['email'] = 'null';
				}
			} catch (err) {}
		}
	});

	// Experiences

	try {
		const listOfExps = experience.nextElementSibling.nextElementSibling;

		const divs = listOfExps.querySelectorAll(
			'div > .display-flex .align-items-center > .mr1'
		);

		const exparr = [];
		divs.forEach((div) => {
			exparr.push(div.querySelector('span').textContent.trim());
		});

		data['experience'] = [...exparr];
	} catch (err) {}

	// Education

	try {
		const educationList = education?.nextElementSibling?.nextElementSibling;
		const institutionNames = educationList.querySelectorAll(
			'span.mr1.t-bold span.visually-hidden'
		);
		const coursesName = educationList.querySelectorAll(
			'span.t-14.t-normal span.visually-hidden'
		);
		const duration = educationList.querySelectorAll(
			'span.t-14.t-normal.t-black--light span.visually-hidden'
		);

		let obj = [];
		for (let i = 0; i < institutionNames.length; i++) {
			obj.push(
				institutionNames[i].textContent.trim() +
					', ' +
					coursesName[i].textContent.trim() +
					', ' +
					duration[i].textContent.trim()
			);
		}

		data['education'] = [...obj];
	} catch (err) {}

	return data;
}
