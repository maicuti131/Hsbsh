const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const chalk = require('chalk');

// Hàm tạo hiệu ứng chữ chạy (gõ từng ký tự)
function delayText(text, delay = 20) {
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

// Hàm tạm dừng chương trình (mili-giây)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Hàm giả lập thanh tiến trình (Loading Bar) cho giao diện đẹp mắt
function progressBar(ms) {
    return new Promise((resolve) => {
        let progress = 0;
        const timer = setInterval(() => {
            progress += 5;
            const dots = "█".repeat(progress / 5);
            const left = "░".repeat(20 - (progress / 5));
            process.stdout.write(`\r${chalk.cyan('[' + dots + left + ']')} ${progress}%`);
            
            if (progress >= 100) {
                clearInterval(timer);
                console.log();
                resolve();
            }
        }, ms / 20);
    });
}

// TOÀN BỘ LOGIC PHẢI NẰM TRONG HÀM ASYNC NÀY ĐỂ TRÁNH LỖI SYNTAX
async function main() {
    console.clear();
    console.log(chalk.magenta.bold('=================================================='));
    await delayText(chalk.cyan.bold('      HỆ THỐNG BÁO CÁO NỘI DUNG ĐỘC HẠI FB        '), 15);
    console.log(chalk.magenta.bold('==================================================\n'));

    // 1. Thu thập thông tin từ người dùng
    await delayText(chalk.yellow('👉 Nhập link Facebook mục tiêu cần báo cáo:'), 10);
    const targetLink = readlineSync.question(chalk.green('> '));

    await delayText(chalk.yellow('👉 Nhập số lượng yêu cầu muốn gửi (Số lượt chạy):'), 10);
    const reportCount = parseInt(readlineSync.question(chalk.green('> ')), 10);

    await delayText(chalk.yellow('👉 Nhập thời gian giãn cách giữa các lượt (Giây):'), 10);
    const delaySeconds = parseInt(readlineSync.question(chalk.green('> ')), 10);

    console.log(chalk.gray('\n[!] Cần tài khoản Facebook để thực hiện hành động này.'));
    await delayText(chalk.yellow('👉 Nhập Tài khoản (Email/SĐT/UID):'), 10);
    const fbUser = readlineSync.question(chalk.green('> '));
    
    await delayText(chalk.yellow('👉 Nhập Mật khẩu Facebook:'), 10);
    const fbPass = readlineSync.question(chalk.green('> '), { hideEchoBack: true });

    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!targetLink || isNaN(reportCount) || isNaN(delaySeconds) || !fbUser || !fbPass) {
        console.log(chalk.red.bold('\n❌ Lỗi: Bạn nhập thiếu thông tin hoặc thông tin không hợp lệ!'));
        return;
    }

    console.log('\n--------------------------------------------------');
    await delayText(chalk.blue('🚀 Đang khởi tạo cấu hình luồng bảo mật...'), 20);
    await progressBar(1500);

    // 2. Kích hoạt trình duyệt tự động Puppeteer
    console.log(chalk.blue('\n🌐 Đang mở trình duyệt và tiến hành đăng nhập...'));
    const browser = await puppeteer.launch({ 
        headless: false, // Để false để bạn thấy tận mắt quá trình bot bấm chuột
        args: ['--disable-notifications', '--start-maximized'] 
    });
    
    const page = await browser.newPage();
    // Đặt kích thước màn hình lớn để dễ tìm phần tử
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // Tiến hành đăng nhập Facebook
        await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
        await page.type('#email', fbUser);
        await page.type('#pass', fbPass);
        await page.click('#loginbutton');
        
        // Chờ chuyển trang sau đăng nhập thành công
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log(chalk.green('✅ Đăng nhập Facebook thành công!'));

        // 3. Vòng lặp gửi báo cáo theo cấu hình của bạn
        for (let i = 1; i <= reportCount; i++) {
            console.log(chalk.yellow(`\n[LƯỢT CHẠY ${i}/${reportCount}] Đang truy cập mục tiêu...`));
            
            // Di chuyển tới bài viết/trang cần báo cáo
            await page.goto(targetLink, { waitUntil: 'networkidle2' });
            await sleep(3000); // Chờ 3 giây cho trang tải hết nội dung

            // Tìm nút Tùy chọn ba chấm "..."
            const moreButton = await page.$('[aria-label="Thêm"], [aria-label="Tùy chọn"], [aria-label="See options"]');
            
            if (moreButton) {
                await moreButton.click();
                await sleep(2000);

                // Tìm và chọn nút "Báo cáo"
                await page.evaluate(() => {
                    const items = Array.from(document.querySelectorAll('span'));
                    const reportBtn = items.find(el => el.textContent.includes('Báo cáo') || el.textContent.includes('Report'));
                    if (reportBtn) reportBtn.click();
                });
                await sleep(3000); // Chờ bảng chọn lý do xuất hiện

                // Chọn lý do độc hại (Mặc định quét tìm chữ "Bạo lực" hoặc "Ngôn từ gây thù ghét")
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

                // Bấm nút "Gửi" / "Tiếp tục" cuối cùng để hoàn tất quy trình báo cáo thật
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
                    console.log(chalk.green(`⚡ [Thành công] Đã gửi xong 1 báo cáo nội dung độc hại (Lượt ${i}).`));
                } else {
                    console.log(chalk.red(`❌ Không tìm thấy nút Gửi/Tiếp tục ở bước cuối.`));
                }

            } else {
                console.log(chalk.red(`❌ Không tìm thấy nút "..." trên trang. Giao diện bài viết này có thể khác biệt.`));
            }

            // Quản lý thời gian giãn cách theo ý muốn của bạn
            if (i < reportCount) {
                console.log(chalk.gray(`⏱️  Hệ thống tạm nghỉ ${delaySeconds} giây trước khi sang lượt tiếp theo...`));
                await sleep(delaySeconds * 1000);
            }
        }

        console.log('\n--------------------------------------------------');
        console.log(chalk.green.bold('🎉 HOÀN THÀNH TOÀN BỘ TIẾN TRÌNH BÁO CÁO!'));
        console.log(chalk.magenta.bold('=================================================='));

    } catch (error) {
        console.log(chalk.red('\n❌ Đã xảy ra lỗi hệ thống:'), error.message);
    } finally {
        // Đóng trình duyệt sau khi hoàn thành công việc
        await browser.close();
    }
}

// ĐÂY LÀ DÒNG GỌI HÀM QUAN TRỌNG ĐỂ KÍCH HOẠT CODE CHẠY
main();
