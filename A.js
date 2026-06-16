const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const chalk = require('chalk');

function delayText(text, delay = 15) {
    return new Promise((resolve) => {
        let i = 0;
        const timer = setInterval(() => {
            process.stdout.write(text[i]);
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                console.log(); 
                resolve();
            }
        }, delay);
    });
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
    console.clear();
    console.log(chalk.magenta.bold('=================================================='));
    await delayText(chalk.cyan.bold('   FB REPORT BOT - OPTIMIZED FOR CLOUD SHELL     '), 10);
    console.log(chalk.magenta.bold('==================================================\n'));

    // Thu thập thông tin
    await delayText(chalk.yellow('👉 Nhập link Facebook mục tiêu cần báo cáo:'), 10);
    const targetLink = readlineSync.question(chalk.green('> '));

    await delayText(chalk.yellow('👉 Nhập số lượng yêu cầu muốn gửi:'), 10);
    const reportCount = parseInt(readlineSync.question(chalk.green('> ')), 10);

    await delayText(chalk.yellow('👉 Nhập thời gian giãn cách (Giây):'), 10);
    const delaySeconds = parseInt(readlineSync.question(chalk.green('> ')), 10);

    console.log(chalk.gray('\n[!] Cấu hình tài khoản Facebook đăng nhập:'));
    await delayText(chalk.yellow('👉 Nhập Tài khoản (Email/SĐT/UID):'), 10);
    const fbUser = readlineSync.question(chalk.green('> '));
    
    await delayText(chalk.yellow('👉 Nhập Mật khẩu:'), 10);
    const fbPass = readlineSync.question(chalk.green('> '), { hideEchoBack: true });

    if (!targetLink || isNaN(reportCount) || isNaN(delaySeconds) || !fbUser || !fbPass) {
        console.log(chalk.red.bold('\n❌ Thông tin không hợp lệ!'));
        return;
    }

    console.log(chalk.blue('\n🌐 Khởi chạy Chromium ngầm (Headless Mode) trên Cloud...'));

    // Cấu hình đặc biệt dành riêng cho môi trường Linux / Cloud Shell
    const browser = await puppeteer.launch({ 
        headless: true, // BẮT BUỘC bằng true trên Cloud Shell
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-notifications'
        ] 
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    try {
        console.log(chalk.gray('🔑 Đang tiến hành đăng nhập ngầm...'));
        await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
        await page.type('#email', fbUser);
        await page.type('#pass', fbPass);
        await page.click('#loginbutton');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log(chalk.green('✅ Đăng nhập Facebook thành công!'));

        for (let i = 1; i <= reportCount; i++) {
            console.log(chalk.yellow(`\n[LƯỢT ${i}/${reportCount}] Đang truy cập mục tiêu...`));
            await page.goto(targetLink, { waitUntil: 'networkidle2' });
            await sleep(3000); 

            // Chụp ảnh màn hình kiểm tra (Hữu ích khi chạy ngầm trên Cloud để debug nếu lỗi)
            // await page.screenshot({ path: `turn_${i}_visited.png` });

            const moreButton = await page.$('[aria-label="Thêm"], [aria-label="Tùy chọn"], [aria-label="See options"]');
            
            if (moreButton) {
                await moreButton.click();
                await sleep(2000);

                await page.evaluate(() => {
                    const items = Array.from(document.querySelectorAll('span'));
                    const reportBtn = items.find(el => el.textContent.includes('Báo cáo') || el.textContent.includes('Report'));
                    if (reportBtn) reportBtn.click();
                });
                await sleep(3000); 

                await page.evaluate(() => {
                    const reasons = Array.from(document.querySelectorAll('span'));
                    const targetReason = reasons.find(el => 
                        el.textContent.includes('Bạo lực') || 
                        el.textContent.includes('Violence') ||
                        el.textContent.includes('Hate speech') ||
                        el.textContent.includes('gây thù ghét')
                    );
                    if (targetReason) targetReason.click();
                });
                await sleep(2000);

                const success = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
                    const submitBtn = buttons.find(b => 
                        b.textContent.includes('Gửi') || 
                        b.textContent.includes('Submit') || 
                        b.textContent.includes('Tiếp tục') ||
                        b.textContent.includes('Next')
                    );
                    if (submitBtn) {
                        submitBtn.click();
                        return true;
                    }
                    return false;
                });

                if (success) {
                    console.log(chalk.green(`⚡ [Thành công] Đã gửi báo cáo lượt ${i}.`));
                } else {
                    console.log(chalk.red(`❌ Không thấy nút Xác nhận gửi.`));
                }

            } else {
                console.log(chalk.red(`❌ Không tìm thấy nút Tùy chọn (...). Giao diện có thể đã chặn bot.`));
            }

            if (i < reportCount) {
                console.log(chalk.gray(`⏱️  Chờ ${delaySeconds} giây...`));
                await sleep(delaySeconds * 1000);
            }
        }

        console.log('\n--------------------------------------------------');
        console.log(chalk.green.bold('🎉 HOÀN THÀNH TOÀN BỘ TIẾN TRÌNH TRÊN CLOUD!'));
        console.log(chalk.magenta.bold('=================================================='));

    } catch (error) {
        console.log(chalk.red('\n❌ Lỗi tiến trình:'), error.message);
    } finally {
        await browser.close();
    }
}

main();
