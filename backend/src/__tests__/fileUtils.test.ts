import {
  formatFileSize,
  generateUniqueFileName,
  getMaterialType,
  isValidFileType,
  sanitizeSearchQuery,
} from '../utils/fileUtils';

describe('getMaterialType', () => {
  it.each([
    ['Lecture 1.pdf', 'pdf'],
    ['slides.PPTX', 'slide'],
    ['notes.docx', 'note'],
    ['diagram.png', 'image'],
    ['recording.mp4', 'video'],
    ['archive.zip', 'other'],
    ['no-extension', 'other'],
  ])('%s is a %s', (file, type) => {
    expect(getMaterialType(file, '')).toBe(type);
  });
});

describe('generateUniqueFileName', () => {
  it('keeps the extension, strips unsafe characters and adds a unique suffix', () => {
    const a = generateUniqueFileName('CSE 3201 (final)!.pdf');
    const b = generateUniqueFileName('CSE 3201 (final)!.pdf');
    expect(a).toMatch(/^CSE_3201__final___\d+_[0-9a-f]{16}\.pdf$/);
    expect(a).not.toBe(b);
  });
});

describe('formatFileSize', () => {
  it('formats sizes with the right unit', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('does not return "undefined" for very large sizes', () => {
    expect(formatFileSize(5 * 1024 ** 5)).toBe('5120 TB');
  });

  it('treats invalid sizes as zero', () => {
    expect(formatFileSize(-10)).toBe('0 Bytes');
    expect(formatFileSize(NaN)).toBe('0 Bytes');
  });
});

describe('isValidFileType and sanitizeSearchQuery', () => {
  it('checks extensions case-insensitively', () => {
    expect(isValidFileType('a.PDF', ['.pdf'])).toBe(true);
    expect(isValidFileType('a.exe', ['.pdf'])).toBe(false);
  });

  it('removes symbols and limits search length', () => {
    expect(sanitizeSearchQuery("  data'; DROP TABLE x;--  ")).toBe('data DROP TABLE x');
    expect(sanitizeSearchQuery('a'.repeat(300))).toHaveLength(100);
  });
});
