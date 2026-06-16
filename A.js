const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const chalk = require('chalk');

// Hàm tạo hiệu ứng chữ chạy
function delayText(text, delay = 25) {
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

// Hàm dừng chương trình theo mili-giây
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
    console.clear();
    console.log(chalk.magenta.bold('=================================================='));
    await delayText(chalk.cyan.bold('      HỆ THỐNG GỬI BÁO CÁO FACEBOOK THỰC TẾ       '), 20);
    console.log(chalk.magenta.bold('==================================================\n'));

    // 1. Nhập thông tin cấu hình từ người dùng
    await delayText(chalk.yellow('👉 Nhập link Facebook cần báo cáo: '), 15);
    const targetLink = readlineSync.question(chalk.green('> '));

    await delayText(chalk.yellow('👉 Số lượng báo cáo muốn gửi: '), 15);
    const reportCount = parseInt(readlineSync.question(chalk.green('> ')), 10);

    await delayText(chalk.yellow('👉 Thời gian giãn cách giữa mỗi lần gửi (giây): '), 15);
    const delaySeconds = parseInt(readlineSync.question(chalk.green('> ')), 10);

    // CẤU HÌNH TÀI KHOẢN FACEBOOK ĐỂ GỬI (Bắt buộc phải đăng nhập mới report được)
    console.log(chalk.gray('\n[!] Cần tài khoản Facebook để thực hiện hành động này.'));
    await delayText(chalk.yellow('👉 Nhập Tài khoản (Email/SĐT/UID): '), 15);
    const fbUser = readlineSync.question(chalk.green('> '));
    
    await delayText(chalk.yellow('👉 Nhập Mật khẩu Facebook: '), 15);
    const fbPass = readlineSync.question(chalk.green('> '), { hideEchoBack: true }); // Ẩn mật khẩu khi nhập

    if (!targetLink || isNaN(reportCount) || isNaN(delaySeconds)) {
        console.log(chalk.red.bold('\n❌ Thông tin nhập vào không hợp lệ!'));
        return;
    }

    console.log('\n--------------------------------------------------');
    await delayText(chalk.blue('🚀 Khởi động trình duyệt ngầm và đăng nhập Facebook...'), 30);

    // 2. Khởi chạy Puppeteer
    const browser = await puppeteer.launch({ 
        headless: false, // Để "false" để bạn nhìn thấy trình duyệt tự chạy. Đổi thành "true" nếu muốn ẩn hoàn toàn.
        args: ['--disable-notifications'] // Tắt thông báo phiền phức của Facebook
    });
    const page = await browser.newPage();
    
    try {
        // Vào trang đăng nhập
        await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
        await page.type('#email', fbUser);
        await page.type('#pass', fbPass);
        await page.click('#loginbutton');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log(chalk.green('✅ Đăng nhập hoàn tất. Bắt đầu tiến trình gửi báo cáo...'));

        // Loop gửi báo cáo
        for (let i = 1; i <= reportCount; i++) {
            console.log(chalk.yellow(`\n[Chạy lượt ${i}/${reportCount}] Moving tới mục tiêu...`));
            
            // Đi tới trang cần report
            await page.goto(targetLink, { waitUntil: 'networkidle2' });
            await sleep(2000);

            // --- ĐOẠN ĐIỀU KHIỂN NÚT BẤM BÁO CÁO (Tùy thuộc giao diện Facebook tại thời điểm chạy) ---
            // Quy trình thông thường: Bấm nút "..." (Thêm) -> Chọn "Tìm hỗ trợ hoặc báo cáo" -> Chọn lý do -> Gửi
            
            // Tìm nút "..." (Thường có thuộc tính aria-label là "Thêm" hoặc "More" tùy ngôn ngữ)
            // Lưu ý: Facebook thay đổi class liên tục nên ta tìm theo thuộc tính aria-label hoặc vai trò (role)
            const moreButton = await page.$('[aria-label="Thêm"], [aria-label="See options"], [aria-label="Tùy chọn"]');
            if (moreButton) {
                await moreButton.click();
                await sleep(1500);

                // Tìm và bấm vào chữ "Báo cáo" hoặc "Tìm hỗ trợ hoặc báo cáo"
                // Cách an toàn nhất là duyệt qua các thẻ chứa chữ "Báo cáo"
                const reportOption = await page.evaluateHandle(() => {
                    const elements = Array.from(document.querySelectorAll('span'));
                    return elements.find(el => el.textContent.includes('Báo cáo') || el.textContent.includes('Report'));
                });

                if (reportOption && reportOption.asElement()) {
                    await reportOption.asElement().click();
                    await sleep(2000);

                    // Tự động chọn một lý do mặc định (ví dụ: Tài khoản giả mạo / Spam)
                    // Đoạn này sẽ click vào lý do đầu tiên hiện lên trong bảng chọn
                    const reasonOption = await page.evaluateHandle(() => {
                        const elements = Array.from(document.querySelectorAll('span'));
                        return elements.find(el => el.textContent.includes('Giả mạo') || el.textContent.includes('Spam'));
                    });

                    if (reasonOption && reasonOption.asElement()) {
                        await reasonOption.asElement().click();
                        await sleep(1500);

                        // Bấm nút "Gửi" hoặc "Tiếp tục" (Submit)
                        const submitButton = await page.evaluateHandle(() => {
                            const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
                            return buttons.find(b => b.textContent.includes('Gửi') || b.textContent.includes('Submit') || b.textContent.includes('Tiếp'));
                        });

                        if (submitButton && submitButton.asElement()) {
                            await submitButton.asElement().click();
                            console.log(chalk.green(`⚡ [Thành công] Đã gửi báo cáo lần thứ ${i}`));
                        }
                    }
                }
            } else {
                console.log(chalk.red(`❌ Không tìm thấy nút Tùy chọn (...) trên trang này. Giao diện có thể đã đổi.`));
            }

            // Chờ hết thời gian giãn cách do bạn thiết lập trước khi chuyển sang lượt tiếp theo
            if (i < reportCount) {
                console.log(chalk.gray(`⏱️ Chờ ${delaySeconds} giây trước lượt tiếp theo...`));
                await sleep(delaySeconds * 1000);
            }
        }

        console.log(chalk.green.bold('\n🎉 ĐÃ HOÀN THÀNH TOÀN BỘ SỐ LƯỢNG BÁO CÁO CẤU HÌNH!'));

    } catch (error) {
        console.log(chalk.red('\n❌ Đã xảy ra lỗi trong quá trình tự động hóa:'), error.message);
    } finally {
        // Đóng trình duyệt sau khi xong việc
        await browser.close();
    }
}

main();
