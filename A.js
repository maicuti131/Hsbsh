const axios = require('axios');
const readlineSync = require('readline-sync');
const chalk = require('chalk');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
    console.clear();
    console.log(chalk.magenta.bold('=================================================='));
    console.log(chalk.cyan.bold('          FB REPORT BOT PURE REQUEST (NO-GUI)     '));
    console.log(chalk.magenta.bold('==================================================\n'));

    // 1. Nhập cấu hình
    console.log(chalk.yellow('👉 Nhập ID (hoặc Link) mục tiêu cần báo cáo:'));
    const target = readlineSync.question(chalk.green('> '));

    console.log(chalk.yellow('👉 Nhập Cookie Facebook của bạn (Dùng để xác thực bot):'));
    const cookie = readlineSync.question(chalk.green('> '));

    console.log(chalk.yellow('👉 Số lượng báo cáo muốn gửi:'));
    const totalReports = parseInt(readlineSync.question(chalk.green('> ')), 10);

    console.log(chalk.yellow('👉 Thời gian giãn cách giữa các lượt (Giây):'));
    const delaySeconds = parseInt(readlineSync.question(chalk.green('> ')), 10);

    if (!target || !cookie || isNaN(totalReports)) {
        console.log(chalk.red.bold('\n❌ Thiếu thông tin cấu hình!'));
        return;
    }

    console.log(chalk.blue('\n🚀 Bot bắt đầu xếp hàng gửi request ngầm...'));
    console.log(chalk.gray('--------------------------------------------------'));

    let success = 0;
    let fail = 0;

    for (let i = 1; i <= totalReports; i++) {
        try {
            // Gửi HTTP POST/GET giả lập hành vi bấm nút report lên cổng mbasic (Cổng nhẹ nhất của FB)
            // Lưu ý: URL này là cấu trúc giả lập cổng API report ngầm của Facebook
            const response = await axios({
                method: 'post',
                url: `https://mbasic.facebook.com/rapid_report/`,
                params: {
                    'action': 'report',
                    'target_id': target // ID bài viết hoặc ID trang cá nhân
                },
                headers: {
                    'cookie': cookie,
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; Mi 9T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'referer': 'https://mbasic.facebook.com/'
                },
                timeout: 5000
            });

            // Nếu Facebook nhận lệnh thành công (trả về trạng thái 200)
            if (response.status === 200) {
                success++;
                console.log(chalk.green(`✅ [Lượt ${i}] Gửi gói tin báo cáo thành công.`));
            } else {
                fail++;
                console.log(chalk.red(`❌ [Lượt ${i}] Lỗi phản hồi từ Facebook (Status: ${response.status})`));
            }

        } catch (error) {
            fail++;
            console.log(chalk.red(`❌ [Lượt ${i}] Thất bại. Nguyên nhân: ${error.message}`));
        }

        // Thời gian nghỉ giữa các lượt để tránh chết Cookie
        if (i < totalReports) {
            console.log(chalk.gray(`⏱️ Nghỉ ${delaySeconds} giây...`));
            await sleep(delaySeconds * 1000);
        }
    }

    console.log('\n--------------------------------------------------');
    console.log(chalk.green.bold('🎉 BOT ĐÃ CHẠY XONG NHIỆM VỤ!'));
    console.log(`📊 Kết quả: Thành công ${chalk.green(success)} | Thất bại ${chalk.red(fail)}`);
    console.log(chalk.magenta.bold('=================================================='));
}

main();
