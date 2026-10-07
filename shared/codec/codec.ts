export interface Codec<TEncoded, TMessage> {
  encode(message: TMessage): TEncoded;
  decode(data: TEncoded): TMessage;
}