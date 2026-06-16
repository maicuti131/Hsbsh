// ... [Đoạn code mở trình duyệt và đăng nhập bài viết mục tiêu] ...

// 1. Tìm và bấm nút Tùy chọn (...) trên bài viết hoặc trang cá nhân
const moreButton = await page.$('[aria-label="Thêm"], [aria-label="Tùy chọn"]');
if (moreButton) {
    await moreButton.click();
    await sleep(2000);

    // 2. Tìm và bấm chọn "Báo cáo bài viết" / "Tìm hỗ trợ hoặc báo cáo"
    await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('span'));
        const reportBtn = items.find(el => el.textContent.includes('Báo cáo') || el.textContent.includes('Report'));
        if (reportBtn) reportBtn.click();
    });
    await sleep(3000); // Chờ bảng lý do hiện lên

    // 3. Tự động chọn lý do độc hại cụ thể (Ví dụ: Ngôn từ gây thù ghét, Bạo lực, Khủng bố...)
    // Facebook sẽ hiện một danh sách các thẻ span chứa nội dung này
    await page.evaluate(() => {
        const reasons = Array.from(document.querySelectorAll('span'));
        // Bạn thay chữ 'Bạo lực' bằng lý do phù hợp (Khỏa thân, Ngôn từ gây thù ghét, Quấy rối...)
        const targetReason = reasons.find(el => el.textContent.includes('Bạo lực') || el.textContent.includes('Violence'));
        if (targetReason) targetReason.click();
    });
    await sleep(2000);

    // 4. Bấm nút "Gửi" hoặc "Tiếp tục" để hoàn tất
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
        const submitBtn = buttons.find(b => b.textContent.includes('Gửi') || b.textContent.includes('Submit') || b.textContent.includes('Tiếp'));
        if (submitBtn) submitBtn.click();
    });
    
    console.log('✅ Đã gửi báo cáo nội dung độc hại thành công theo đúng quy trình của Facebook.');
}
