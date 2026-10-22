# Background-removal models

| File | Model | Size | Licence | Source |
|---|---|---|---|---|
| `u2netp.onnx` | U²-Net lite (u2netp), 320×320 input | 4,574,861 bytes | Apache-2.0 | rembg release v0.0.0 — https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx |

The optional **HD cut-out** uses the full U²-Net (`u2net.onnx`, 175,997,641 bytes, Apache-2.0).
It is not stored in this repo; the browser downloads it on demand from the Hugging Face mirror
https://huggingface.co/BritishWerewolf/U-2-Net/resolve/main/onnx/model.onnx
(SHA-256 8d10d2f3bb75ae3b6d527c77944fc5e7dcd94b29809d47a739a7a728a912b491) and keeps it in Cache Storage.

U²-Net: Qin et al., "U²-Net: Going Deeper with Nested U-Structure for Salient Object Detection", Pattern Recognition 2020.

## Removing the person (clothes worn by someone)

When a photo shows a person, the app also runs **SegFormer-B2 fine-tuned for clothes**
(`mattmdjaga/segformer_b2_clothes`, quantized ONNX build `Xenova/segformer_b2_clothes`,
`onnx/model_quantized.onnx`, 28,837,959 bytes). It labels each pixel as clothing
(top / dress / pants / skirt / shoes / bag / scarf / hat / belt) or person (face / hair / arms / legs);
only the clothing is kept, each garment as its own piece, with U²-Net supplying the outline.
Downloaded on first use from https://huggingface.co/Xenova/segformer_b2_clothes and cached in the browser.

**Licence caution:** the model card lists its licence as "other" and it was fine-tuned on the
ATR human-parsing dataset, which is released for research use. Fine for this prototype /
portfolio; check the licence (or swap in a commercially licensed parser) before a commercial launch.
