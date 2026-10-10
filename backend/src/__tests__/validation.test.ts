import type { NextFunction, Request, Response } from 'express';
import {
  castVoteSchema,
  confirmUploadSchema,
  createElectionSchema,
  createScheduleSchema,
  uploadMaterialSchema,
  validate,
} from '../middleware/validation';

interface MockRes {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockRes;
  json: (b: unknown) => MockRes;
}

function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(b) {
      res.body = b;
      return res;
    },
  };
  return res;
}

const asRes = (r: MockRes) => r as unknown as Response;

describe('validate middleware', () => {
  it('passes valid data on, parsed by the schema', () => {
    const req = { body: { title: 'Data structures notes', disciplineId: 'cse', tags: 'dsa, trees' } } as Request;
    const next = jest.fn() as NextFunction;
    validate(uploadMaterialSchema)(req, asRes(mockRes()), next);
    expect(next).toHaveBeenCalled();
    expect(req.body.tags).toEqual(['dsa', 'trees']);
  });

  it('answers 400 with the failing fields', () => {
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    validate(uploadMaterialSchema)({ body: { title: 'x' } } as Request, asRes(res), next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect((res.body as { details: string[] }).details).toEqual(
      expect.arrayContaining([expect.stringContaining('title'), expect.stringContaining('disciplineId')]),
    );
  });

  it('never logs the submitted values', () => {
    const spy = jest.spyOn(console, 'error');
    spy.mockClear();
    validate(uploadMaterialSchema)({ body: { title: 'x', password: 'hunter2' } } as Request, asRes(mockRes()), jest.fn());
    expect(JSON.stringify(spy.mock.calls)).not.toContain('hunter2');
  });
});

describe('schemas', () => {
  it('turns empty optional upload fields into undefined', () => {
    const parsed = confirmUploadSchema.parse({
      title: 'Lab manual',
      disciplineId: 'cse',
      batchId: '',
      category: '',
      filePath: 'materials/a.pdf',
      fileName: 'a.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
    });
    expect(parsed.batchId).toBeUndefined();
    expect(parsed.category).toBeUndefined();
    expect(parsed.tags).toEqual([]);
  });

  it('requires schedule dates as YYYY-MM-DD', () => {
    const base = {
      type: 'class_test',
      title: 'CT 1',
      discipline_id: '9b2f6f8e-8d2c-4d0b-9a7a-1c2b3d4e5f60',
      term: '3-1',
    };
    expect(createScheduleSchema.safeParse({ ...base, schedule_date: '2026-10-12' }).success).toBe(true);
    expect(createScheduleSchema.safeParse({ ...base, schedule_date: '12/10/2026' }).success).toBe(false);
  });

  it('refuses an election that ends before it starts', () => {
    const r = createElectionSchema.safeParse({
      batch_id: '9b2f6f8e-8d2c-4d0b-9a7a-1c2b3d4e5f60',
      title: 'CR election',
      start_date: '2026-11-02',
      end_date: '2026-11-01',
    });
    expect(r.success).toBe(false);
  });

  it('only accepts a real candidate id for a vote', () => {
    expect(castVoteSchema.safeParse({ candidate_id: 'not-a-uuid' }).success).toBe(false);
  });
});
