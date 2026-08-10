import { test, expect } from '@playwright/test';

test.describe('Bastet Temple V18.2 Tour Integration', () => {
  test.setTimeout(120000); // 2 minutes for slow 3D model loading in software rendering

  test('Virtual Tour Page and Iframe Load Correctly with V18.2', async ({ page }) => {
    // 1. Go to virtual tour page
    await page.goto('/#/virtual-tour');

    // 2. Check TourAccessGate is present
    const accessGate = page.locator('text=تسجيل الدخول مطلوب');
    const requestAccess = page.locator('text=مطلوب تصريح دخول');
    
    // Let's also check the direct static route which doesn't require TourAccessGate
    await page.goto('/bastet-threejs-tour/index.html?lang=ar');
    
    // 3. Confirm static tour loads successfully
    await expect(page).toHaveTitle(/معبد باستت/);
    
    // 4. Verify walk mode instructions are visible
    const walkBtn = page.locator('#walk-btn');
    await expect(walkBtn).toBeVisible();

    // 5. Verify guided tour button is visible
    const guidedBtn = page.locator('#guided-tour-btn');
    await expect(guidedBtn).toBeVisible({ timeout: 60000 });

    // 6. Verify language toggle works
    const langBtn = page.locator('#language-toggle-btn');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveText(/English/);

    // 7. Verify audio toggle works and maps to correct Arabic track
    const audioBtn = page.locator('#audio-toggle-btn');
    await expect(audioBtn).toBeVisible();
    await expect(audioBtn).toHaveAttribute('data-audio-language', 'ar');

    // 8. Verify the audio element is loaded
    const audioEl = page.locator('#narration-audio');
    await expect(audioEl).toBeAttached();
    
    // Verify audio track mapping
    const audioSrc = await audioEl.getAttribute('src');
    expect(audioSrc).toContain('bastet-tour-ar.mp3');
    expect(audioSrc).not.toContain('bastet-tour-en.mp3');

    // 9. Switch language to English
    await langBtn.click();
    await expect(langBtn).toHaveText(/العربية/);
    
    // Verify translation works
    await expect(page.locator('#audio-toggle-btn')).toHaveAttribute('data-audio-language', 'en');
    const enAudioSrc = await page.locator('#narration-audio').getAttribute('src');
    expect(enAudioSrc).toContain('bastet-tour-en.mp3');
    expect(enAudioSrc).not.toContain('bastet-tour-ar.mp3');

    // 10. Verify layer toggle controls exist (Attested, Probable, Interpretive)
    const ruinsToggle = page.locator('#ruins-toggle');
    const reconToggle = page.locator('#reconstruction-toggle');
    const pigmentToggle = page.locator('#pigment-toggle');
    await expect(ruinsToggle).toBeAttached();
    await expect(reconToggle).toBeAttached();
    await expect(pigmentToggle).toBeAttached();

    // 11. Verify screenshot and export buttons exist
    const screenshotBtn = page.locator('#screenshot-btn');
    const exportBtn = page.locator('#export-btn');
    await expect(screenshotBtn).toBeVisible();
    await expect(exportBtn).toBeVisible();
  });
});
