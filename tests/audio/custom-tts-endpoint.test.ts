import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { generateTTS } from '@/lib/audio/tts-providers';

const mockFetch = vi.hoisted(() => vi.fn() as Mock);

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal<typeof import('undici')>();
  return { ...actual, fetch: mockFetch };
});

describe('custom OpenAI-compatible TTS endpoint', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'audio/mpeg' },
      arrayBuffer: async () => new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
    });
  });

  it('uses the configured request path and trims a trailing base URL slash', async () => {
    await generateTTS(
      {
        providerId: 'custom-tts-gateway',
        apiKey: 'sk-test',
        baseUrl: 'https://gateway.example/v1/',
        voice: 'alloy',
        providerOptions: { endpointPath: '/tenant/speech' },
      },
      'Hello',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://gateway.example/v1/tenant/speech',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps the default speech path when the option is missing or malformed', async () => {
    await generateTTS(
      {
        providerId: 'custom-tts-gateway',
        baseUrl: 'https://gateway.example/v1',
        voice: 'alloy',
      },
      'Hello',
    );
    await generateTTS(
      {
        providerId: 'custom-tts-gateway',
        baseUrl: 'https://gateway.example/v1',
        voice: 'alloy',
        providerOptions: { endpointPath: 'https://other.example/speech' },
      },
      'Hello',
    );

    expect(mockFetch.mock.calls[0][0]).toBe('https://gateway.example/v1/audio/speech');
    expect(mockFetch.mock.calls[1][0]).toBe('https://gateway.example/v1/audio/speech');
  });

  it('keeps built-in OpenAI on its standard path', async () => {
    await generateTTS(
      {
        providerId: 'openai-tts',
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        voice: 'alloy',
        providerOptions: { endpointPath: '/tenant/speech' },
      },
      'Hello',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/speech',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
