# VIE - **Poison the data before it gets to them.**

Over 4,000 data brokers scrape photos from social platforms in real time, building permanent biometric databases without consent. We built VIE for the activist who doesn't want their face in a government database and the person leaving a dangerous situation who needs to exist online without being found.

## What it does

VIE is a free web tool that makes facial recognition systems unable to identify anyone in your photos — while the image looks completely unchanged to the human eye.

Upload a photo. Our model detects **every face** in the image, encodes each into a latent representation, applies an imperceptible adversarial perturbation via a VAE, and reconstructs the image. The result looks identical to you. To a recognition system, it's an entirely different person. You get your protected image plus a **privacy score** for every face — validated against multiple recognition models.

## How we built it

**Frontend:** React + Tailwind CSS for uploading, face selection, and per-face privacy scores.

**Backend:** FastAPI serving our ML pipeline — face detection, VAE encoding into a compact latent space, targeted adversarial perturbation, and photorealistic reconstruction. We validate against DeepFace, CompreFace, and ArcFace [3] to ensure protection generalizes across recognition architectures.

**Deployment:** Vercel (frontend) + Railway (backend/model serving).

## Challenges we ran into

The core tension: how little can you change an image so a human notices nothing but an AI is completely fooled? Too subtle and recognition still matches; too aggressive and the image visibly degrades. Perturbations also had to generalize across recognition architectures simultaneously — defeating one model but not another gives a false sense of security.

## Accomplishments that we're proud of

Existing tools like Fawkes [1] and LowKey [2] protect a single face against one or a small ensemble of models. VIE protects **every face in the frame** and validates against multiple recognition systems simultaneously. We provide a transparent privacy score rather than asking users to trust blindly. And the full product is a free website — no installs, no technical knowledge required.

## What we learned

Privacy isn't an individual problem — it's a collective one. Protecting just your face doesn't help if everyone around you is still exposed. The most meaningful design decision we made was treating every face in a photo as equally worth protecting.

## What's next for VIE

A public API so developers can integrate VIE into their own apps, a browser extension that protects images automatically before they leave your device, and batch processing for entire photo libraries.


[1] Shan et al., ["Fawkes: Protecting Privacy against Unauthorized Deep Learning Models,"](https://www.usenix.org/conference/usenixsecurity20/presentation/shan) USENIX Security, 2020.

[2] Cherepanova et al., ["LowKey: Leveraging Adversarial Attacks to Protect Social Media Users from Facial Recognition,"](https://arxiv.org/abs/2101.07922) ICLR, 2021.

[3] Deng et al., ["ArcFace: Additive Angular Margin Loss for Deep Face Recognition,"](https://arxiv.org/abs/1801.07698) CVPR, 2019.