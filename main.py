from flask import Flask, render_template, jsonify, request
import random
import time
import json

app = Flask(__name__)

# Character class represents both player and monsters
class Character:
    def __init__(self, name, attack_power, health, mana, defense):
        self.name = name
        self.attack_power = attack_power
        self.health = health
        self.mana = mana
        self.defense = defense

    def __str__(self):
        return f"{self.name}: Attack={self.attack_power}, Health={self.health}, Mana={self.mana}, Defense={self.defense}"

    def equip_armor(self, defense_boost):
        """Equips armor, increasing defense."""
        self.defense += defense_boost
        print(f"{self.name} equipped armor! Defense increased to {self.defense:.2f}.")

    def check_chest(self):
        """Checks a chest for armor."""
        if random.random() < 0.45:  # 45% chance of finding armor
            defense_boost = random.randint(10, 50)  # Random defense boost
            self.equip_armor(defense_boost)
        else:
            print(f"{self.name} found nothing in the chest.")

    def attack_target(self, target, damage):
        """Attacks another character."""
        actual_damage = damage
        if self.defense == 0:  # Damage boost if no armor
            actual_damage *= 1.03

        if target.defense > 0:
            actual_damage = max(0, actual_damage - (actual_damage * (target.defense / 100)))  # Apply damage reduction.
            target.defense = max(0, target.defense - 5)  # Reduce defense
            print(f"{self.name} attacks {target.name} for {actual_damage:.2f} damage (Defense reduced).")
        else:
            print(f"{self.name} attacks {target.name} for {actual_damage:.2f} damage (No defense).")

        target.health -= actual_damage
        target.health = max(0, target.health)  # Ensure health doesn't go below 0
        print(f"{target.name}'s health: {target.health:.2f}")

    def take_damage(self, damage):
        actual_damage = max(0, damage - self.defense)
        self.health -= actual_damage
        if self.health < 0:
            self.health = 0
        return actual_damage

    def is_alive(self):
        return self.health > 0

    def attack_enemy(self, enemy):
        damage = random.randint(1, self.attack_power)
        actual_damage = enemy.take_damage(damage)
        return actual_damage


class Swordsman(Character):
    def __init__(self, name):
        # Swordsman has higher attack, lower health, and no mana
        super().__init__(name, attack_power=20, health=80, mana=0, defense=100)


class Mage(Character):
    def __init__(self, name):
        # Mage has lower attack, higher health, and starting mana of 5
        super().__init__(name, attack_power=14, health=80, mana=150, defense=60)
        self.initial_mana = 5  # Track the starting mana


class CelestialMonk(Character):
    def __init__(self, name):
        super().__init__(name, attack_power=25, mana=75, defense=50, health=100)


class FrostRevenant(Character):
    def __init__(self, name):
        super().__init__(name, attack_power=18, mana=120, health=120, defense=50)


# The Monster class should have attack_player method already defined
class Monster(Character):
    def __init__(self, name, health, attack_power, defense):
        super().__init__(name, attack_power, health, 0, defense)


# Modify the following monster classes to inherit from Monster, not Character
class Goblin(Monster):
    def __init__(self, name, health, attack_power, defense):
        super().__init__(name, health, attack_power, defense)


class Kobalt(Monster):
    def __init__(self, name, health, attack_power, defense):
        super().__init__(name, health, attack_power, defense)


class Skeleton(Monster):
    def __init__(self, name, health, attack_power, defense):
        super().__init__(name, health, attack_power, defense)


# Areas and Floor System
class Area:
    def __init__(self, name: str, floor_range: tuple, monster_pools: dict):
        self.name = name
        self.floor_range = floor_range
        self.monster_pools = monster_pools
        self.current_monsters = 0
        self.spawn_pool = []
        self.spawn_rate = []

    def get_monster_pool(self, current_floor):
        if current_floor in range(self.floor_range[0], self.floor_range[1] + 1):
            return self.monster_pools
        return None

    def __str__(self):
        return f"{self.name} (Floors {self.floor_range[0]}-{self.floor_range[1]})"


def choose_character() -> Character:
    print("Welcome to the Tomb of the dead!,"
          "Enter at your own peril ")
    print("Choose your character class:")
    print("1. Swordsman (Higher attack, lower health, no mana)")
    print("2. Mage (Lower attack, higher health, starting mana of 5 that increases with each monster defeated)")
    print("3. FrostRevenant ( A backer, highest health and most versatile attacks with their own defense system)")
    print("4. CelestialMonk (a heavy hitter, highest starting attack power, with the ability to use mana)")

    choice = input("Enter the number of your choice (1 thru 4 ): ")

    if choice == "1":
        name = input("Enter the name of your Swordsman: ")
        character = Swordsman(name)
        print(f"\nYou have chosen {character.name}, the Swordsman!")
        print(character)
    elif choice == "2":
        name = input("Enter the name of your Mage: ")
        character = Mage(name)
        print(f"\nYou have chosen {character.name}, the Mage!")
        print(character)
    elif choice == "3":
        name = input("Enter the name of your FrostRevenant: ")
        character = FrostRevenant(name)
        print(f"\nYou have chosen {character.name}, the FrostRevenant!")
        print(character)
    elif choice == "4":
        name = input("Enter the name of your CelestialMonk: ")
        character = CelestialMonk(name)
        print(f"\nYou have chosen {character.name}, the CelestialMonk!")
        print(character)
    else:
        print("Invalid choice. Please choose either 1 or 2.")
        return choose_character()  # Restart the choice prompt if invalid input is given

    return character


# Starting the game and choosing a character
# chosen_character = choose_character()


# Global Variables
stage = 1


# Event-based random dungeon generation
def generate_dungeon_stage() -> Area:
    # Random dungeon stage factor (can affect difficulty)
    print(f"Stage Value: {stage}")
    if stage == 1:
        return LAND_OF_THE_DEAD
    elif stage == 2:
        return LANDS_INBETWEEN
    else:
        return BOTTOM_FLOOR


# Printing status of the game
def print_status(player, monsters):
    print(f"\n{player.name} - Health: {player.health}, Attack: {player.attack_power}, Defense: {player.defense}")
    for monster in monsters:
        print(f"{monster.name} - Health: {monster.health}, Attack: {monster.attack_power}, Defense: {monster.defense}")
    print("\n")


# Modify combat to print the actual monster names
# Modify combat to handle non-integer input gracefully
def combat(player, monsters):
    """Handle the combat between player and monsters."""
    while player.is_alive() and any(monster.is_alive() for monster in monsters):
        print_status(player, monsters)

        # Player's turn to attack
        print(f"{player.name}'s turn!")
        try:
            target_idx = int(input("Choose a monster to attack (1 for first, 2 for second, etc.): ")) - 1
            if 0 <= target_idx < len(monsters) and monsters[target_idx].is_alive():
                damage = player.attack_enemy(monsters[target_idx])
                print(f"{player.name} attacks {monsters[target_idx].name} for {damage} damage!")
            else:
                print("Invalid target! No attack made.")
        except ValueError:
            print("Invalid input! Please enter a valid number.")
            continue

        # Monsters' turn to attack
        if any(monster.is_alive() for monster in monsters):
            time.sleep(1)  # Dramatic pause
            print("\nThe monsters are attacking!")
            for monster in monsters:
                if monster.is_alive():
                    damage = monster.attack_player(player)
                    print(f"{monster.name} attacks you for {damage} damage!")

        # Check if player is still alive
        if not player.is_alive():
            print(f"\nGame Over! {player.name} has fallen in battle.")
            return False

    if not any(monster.is_alive() for monster in monsters):
        print("\nYou have defeated all the monsters!")
        return True


# Random event in the dungeon (treasure, trap, etc.)
def random_event(player):
    event = random.choice(["treasure", "trap", "nothing"])
    if event == "treasure":
        treasure_value = random.randint(1, 5)
        print(f"\nYou find a treasure chest! You gain {treasure_value} health and attack boost.")
        player.health += treasure_value
        player.attack_power += treasure_value
    elif event == "trap":
        trap_damage = random.randint(5, 15)
        print(f"\nYou triggered a trap! You take {trap_damage} damage.")
        player.take_damage(trap_damage)
    else:
        print("\nYou walk through the dungeon without encountering anything.")


# Modify the getMonster function to correctly instantiate the monster class
# Corrected getMonster function
# Corrected getMonster function
def getMonster(area):
    """Get a random monster from the area's monster pool with balanced stats."""
    monster_type = random.choice(list(area.monster_pools.keys()))
    monster_stats = area.monster_pools[monster_type]

    # Add randomness to monster stats within a reasonable range
    health_variance = random.uniform(0.8, 1.2)
    attack_variance = random.uniform(0.9, 1.1)
    defense_variance = random.uniform(0.9, 1.1)

    health = int(monster_stats['health'] * health_variance)
    attack = int(monster_stats['attack'] * attack_variance)
    defense = int(monster_stats['defense'] * defense_variance)

    return {
        'type': monster_type,
        'name': f"{monster_type} {random.choice(['Warrior', 'Hunter', 'Brute', 'Scout'])}",
        'health': health,
        'max_health': health,
        'attack': attack,
        'defense': defense,
        'description': monster_stats.get('description', f"A fearsome {monster_type} ready for battle!")
    }


def end_game():
    print("Game Over! Better luck next time.")
    exit()


@app.route('/')
def index():
    return render_template('index.html')


# Define game areas with monster pools
LAND_OF_THE_DEAD = Area("The Land of the Dead", (1, 3), {
    "Goblin": {"health": (10, 25), "attack": (8, 13), "defense": (4, 15), "mana": (0, 0)},
    "Kobalt": {"health": (12, 17), "attack": (10, 15), "defense": (8, 15), "mana": (0, 0)},
    "Skeleton": {"health": (15, 25), "attack": (15, 20), "defense": (15, 20), "mana": (0, 0)}
})

LANDS_INBETWEEN = Area("The Lands Inbetween", (4, 5),{
    "FrostGoblin": {"health": (25, 32), "attack": (20,30), "defense": (10, 25), "mana": (5, 15)},
    "StoneGolem": {"health": (28, 35), "attack": (35, 45), "defense": (15, 30), "mana": (5, 15)},
    "FireTroll": {"health": (30,35),"attack": (32, 42),"defense": (12, 28),"mana": (5, 15)}
})
BOTTOM_FLOOR = Area("The Bottom Floor", (6, 6), {
    "FireGiant": {"health": (45, 69), "attack": (50, 75), "defense": (35, 55), "mana": (20, 30)},
    "Demon": {"health": (60, 72), "attack": (55, 75), "defense": (40, 55), "mana": (25, 30)},
    "Lich": {"health": (62, 80), "attack": (60, 70), "defense": (45, 55), "mana": (28, 30)}
})

BOSS_FLOOR = Area("The Tomb", (7, 7), {
    "LordOfTheTomb": {"health": (200, 200), "attack": (100, 125), "defense": (60, 60), "mana": (60, 70)}
})

@app.route('/start_game', methods=['POST'])
def start_game_route():
    data = request.get_json()
    character_choice = data.get('choice')
    character_name = data.get('name')

    print(f"Received start_game: choice={character_choice}, name={character_name}")  # debug line

    if character_choice == "Swordsman":
        character = Swordsman(character_name)
    elif character_choice == "Mage":
        character = Mage(character_name)
    elif character_choice == "FrostRevenant":
        character = FrostRevenant(character_name)
    elif character_choice == "CelestialMonk":
        character = CelestialMonk(character_name)
    else:
        return jsonify({'error': f'Invalid character choice: {character_choice}'}), 400

    return jsonify({
        'name': character.name,
        'attack': character.attack_power,
        'health': character.health,
        'mana': character.mana,
        'defense': character.defense,
        'type': character.__class__.__name__,
        'currentFloor': 1
    })




@app.route('/attack', methods=['POST'])
def attack():
    """Handle attack actions with improved combat mechanics."""
    data = request.get_json()
    player = data.get('player')
    monster = data.get('monster')
    ability = data.get('ability', 'basic_attack')

    if not player or not monster:
        return jsonify({'error': 'Invalid request data'}), 400

    # Calculate damage with variance and critical hits
    base_damage = calculate_ability_damage(player['attack'], ability)
    crit_chance = 0.15  # 15% chance for critical hit
    is_crit = random.random() < crit_chance

    if is_crit:
        damage = base_damage * 1.5
        message = f"Critical hit! {player['name']} deals {damage:.1f} damage!"
    else:
        damage = base_damage
        message = f"{player['name']} attacks for {damage:.1f} damage!"

    # Apply defense reduction
    damage = max(1, damage - (monster['defense'] * 0.5))
    monster['health'] -= damage

    # Monster counterattack if still alive
    counter_message = ""
    if monster['health'] > 0:
        counter_damage = calculate_monster_damage(monster['attack'])
        player['health'] -= counter_damage
        counter_message = f"\n{monster['name']} counterattacks for {counter_damage:.1f} damage!"

    # Update game state
    monster['health'] = max(0, monster['health'])
    player['health'] = max(0, player['health'])

    return jsonify({
        'player': player,
        'monster': monster,
        'message': message + counter_message,
        'is_crit': is_crit
    })


# Consider adding a balance system
def calculate_ability_damage(base_attack, ability_type='basic_attack'):
    """Calculate damage for different ability types."""
    damage_multipliers = {
        'basic_attack': 1.0,
        'heavy_strike': 1.4,
        'quick_slash': 0.8,
        'power_blow': 1.6
    }

    multiplier = damage_multipliers.get(ability_type, 1.0)
    variance = random.uniform(0.9, 1.1)
    return base_attack * multiplier * variance

def calculate_monster_damage(base_attack):
    """Calculate monster damage with variance."""
    variance = random.uniform(0.8, 1.2)
    return base_attack * variance


# # Cache frequently accessed elements
# class UICache:
#     def __init__(self):
#         self.prompt_screen = document.getElementById('prompt-screen')
#         self.context_buttons = document.getElementById('context-buttons')
#         # ... other elements


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)

def place_random_door(room_element):
    # List of possible door positions
    positions = ['north', 'south', 'east', 'west']
    # Choose a random position
    random_position = random.choice(positions)

    # Create door element
    door = document.createElement('div')
    door.className = f'door {random_position}'

    # Add door to room
    room_element.appendChild(door)