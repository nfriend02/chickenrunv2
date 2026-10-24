using System.Collections;
using UnityEngine;
using ChickenRun.Core;

namespace ChickenRun.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class ChickenController : MonoBehaviour
    {
        [Header("Movement & Physics")]
        [SerializeField] private float baseSpeed = 10f;
        [SerializeField] private float jumpForce = 14f;
        [SerializeField] private float gravity = -35f;

        [Header("Powerups")]
        [SerializeField] private GameObject fireAuraFX;
        [SerializeField] private GameObject goldenAuraFX;
        [SerializeField] private GameObject somersaultMesh;

        private CharacterController controller;
        private Vector3 velocity;
        private int jumpCount = 0;
        private int maxJumps = 1;

        public int Feathers { get; private set; }
        public bool IsInvincible { get; private set; }
        public bool HasSpicyPepper { get; private set; }
        public bool HasGoldenBanana { get; private set; }
        public bool HasMagnet { get; private set; }
        public bool IsFever { get; private set; }

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
        }

        public void Init(int initialFeathers)
        {
            Feathers = initialFeathers;
            IsInvincible = false;
            HasSpicyPepper = false;
            HasGoldenBanana = false;
            HasMagnet = false;
            IsFever = false;
            maxJumps = 1;
        }

        public void Jump()
        {
            if (jumpCount < maxJumps)
            {
                jumpCount++;
                velocity.y = jumpForce;
                StartCoroutine(DoSomersault());
            }
        }

        private IEnumerator DoSomersault()
        {
            float elapsed = 0f;
            float duration = 0.6f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                if (somersaultMesh != null)
                {
                    somersaultMesh.transform.Rotate(Vector3.forward, 720f * Time.deltaTime);
                }
                yield return null;
            }
            if (somersaultMesh != null)
            {
                somersaultMesh.transform.localRotation = Quaternion.identity;
            }
        }

        public void Move(Vector2 inputDirection)
        {
            float speedMultiplier = (HasSpicyPepper || IsFever) ? 1.8f : 1.0f;
            Vector3 move = new Vector3(inputDirection.x, 0, inputDirection.y) * (baseSpeed * speedMultiplier);
            
            if (controller.isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
                jumpCount = 0;
            }

            velocity.y += gravity * Time.deltaTime;
            move.y = velocity.y;

            controller.Move(move * Time.deltaTime);
        }

        public void TakeDamage()
        {
            if (IsInvincible || HasSpicyPepper || IsFever) return;

            Feathers--;
            StartCoroutine(InvincibilityRoutine());
        }

        private IEnumerator InvincibilityRoutine()
        {
            IsInvincible = true;
            yield return new WaitForSeconds(1.2f);
            IsInvincible = false;
        }

        public void ApplySpicyPepper(float duration) => StartCoroutine(PepperRoutine(duration));
        private IEnumerator PepperRoutine(float duration)
        {
            HasSpicyPepper = true;
            if (fireAuraFX) fireAuraFX.SetActive(true);
            yield return new WaitForSeconds(duration);
            HasSpicyPepper = false;
            if (fireAuraFX) fireAuraFX.SetActive(false);
        }

        public void ApplyGoldenBanana(float duration) => StartCoroutine(BananaRoutine(duration));
        private IEnumerator BananaRoutine(float duration)
        {
            HasGoldenBanana = true;
            maxJumps = 2;
            if (goldenAuraFX) goldenAuraFX.SetActive(true);
            yield return new WaitForSeconds(duration);
            HasGoldenBanana = false;
            maxJumps = 1;
            if (goldenAuraFX) goldenAuraFX.SetActive(false);
        }

        public void ApplyMagnet(float duration) => StartCoroutine(MagnetRoutine(duration));
        private IEnumerator MagnetRoutine(float duration)
        {
            HasMagnet = true;
            yield return new WaitForSeconds(duration);
            HasMagnet = false;
        }

        public void ActivateFever(float duration) => StartCoroutine(FeverRoutine(duration));
        private IEnumerator FeverRoutine(float duration)
        {
            IsFever = true;
            transform.localScale = Vector3.one * 1.8f;
            yield return new WaitForSeconds(duration);
            IsFever = false;
            transform.localScale = Vector3.one;
        }
    }
}
