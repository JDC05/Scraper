const puppeteer = require('puppeteer');
const padelCourtsNumber = ['Court 1 [ A S K Lettings ] (D)', 'Court 2 [ ProParts Direct ] (D)', 'Court 3 [ Kahani Lounge ] (D)', 'Court 4 [ InterCoach Travels ] (D)', 'Court 5 [ Clifton Coffee ] (S)', 'Court 6 (S)', 'Court 7 (D)', 'Court 8 (D)', 'Court 9 (D)', 'Court 10 (D)', 'Court 11 (D)', 'Court 12 (S)'];

checkAvailableSlots();


async function checkAvailableSlots() {
    try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto('https://www.rocketpadel.com/club/ilford');

        // Wait until the 'booking' button is visible and click it
        await page.waitForSelector('button', { visible: true });
        await page.evaluate(() => {
            const button = document.querySelector('button');
            if (button) button.click();
        });

        // Wait for <h3> elements to load, then click on the one containing "Ilford"
        await page.waitForSelector('h3', { visible: true });
        await page.evaluate(() => {
            const h3Elements = Array.from(document.querySelectorAll('h3'));
            const ilfordElement = h3Elements.find(el => el.textContent.includes('Ilford'));
            if (ilfordElement) ilfordElement.click();
        });

        // Listen for a new page to open
        const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));
        
        // Get the new page object
        const newPage = await newPagePromise;

        // Wait until the new page is loaded
        await newPage.waitForNavigation({ waitUntil: 'networkidle0' });

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + i);
            
            const formattedDate = currentDate.toISOString().slice(0, 10);
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

            console.log(`${dayName}: ${formattedDate}`);

            const newUrl = `https://playtomic.io/rocket-padel-ilford/fcfd88fe-4988-4a23-8d6d-f76db523de95?q=PADEL~${formattedDate}~~~`;
            await newPage.goto(newUrl, { waitUntil: 'networkidle0' });

            try {
                // Check for availability message
                const slotsSelector = '.bbq2__slots';
                const slotsExists = await newPage.$(slotsSelector);
        
                if (slotsExists) {

                    const slotsResources = await newPage.$$('.bbq2__slots-resource');
        
                    let slotsAvailable = false; // Flag to check if any slot is open
                    let courtNumber = 0;

                    for (const slotResource of slotsResources) {
                        let str = '';
                        
                        const slots = await slotResource.$$('.bbq2__slot');
                        for (const slot of slots) {
                            const hasOpenSlot = await slot.$('.bbq2-open');
                            if (hasOpenSlot) {
                                slotsAvailable = true; // Set flag if an open slot is found

                                // Retrieve the style attributes of `.bbq2__slot`
                                const slotStyles = await slot.evaluate(el => el.getAttribute('style'));

                                const leftMatch = slotStyles.match(/left:\s*(\d+)px/);
                                const widthMatch = slotStyles.match(/width:\s*(\d+)px/);

                                const leftValue = parseInt(leftMatch[1], 10) / 36;
                                const widthValue = parseInt(widthMatch[1], 10) / 36;
                                
                                // Function to convert decimal hours to HH:MM format
                                const convertToTime = (decimalHour) => {
                                    const hours = Math.floor(decimalHour);
                                    const minutes = Math.round((decimalHour - hours) * 60);
                                    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                };

                                // Convert start and end times to HH:MM
                                const startTime = convertToTime(leftValue);
                                const endTime = convertToTime(leftValue + widthValue);

                                // Append to the string
                                str += ` [${startTime}-${endTime}]`;
                            }
                        }

                        console.log(`${padelCourtsNumber[courtNumber]}:${str}`);
                        courtNumber++;
                        
                    }
            
                    if (!slotsAvailable) {
                        console.log(`${formattedDate}: No slots available on any court.`);
                    }

                } else {
                    console.log(`${formattedDate}: Slots not available`);
                }
        
            } catch (error) {
                console.error(`${formattedDate}: An error occurred while checking for messages:`, error);
            }

            console.log("\n\n\n");
            
        }
        
        
        await browser.close();
    } catch (error) {
        console.error(error);
    }
};




